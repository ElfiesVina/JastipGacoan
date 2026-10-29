/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan layar Masuk/Daftar, atau teruskan ke dashboard / detail sesi.
 */
import { app, $, $$ } from '../core/dom.js';
import { state } from '../core/state.js';
import { store } from '../core/storage.js';
import { getRecent } from '../core/recent.js';
import { toast, lock, skeleton, setBusy, ready } from '../core/ui.js';
import { POLL_MS } from '../core/constants.js';
import { getSession, signIn, signUp, signOut, sendResetEmail, updatePassword, verifyResetCode } from '../api/auth.api.js';
import { OPENED_FROM_RECOVERY_LINK, RESET_LINK_EXPIRED } from '../api/client.js';
import { getProfile, saveProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { authScreenHTML } from '../components/auth-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { markOnline, markOffline } from '../services/presence.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';
import { showTab } from './admin-tabs.js';
import { statusPendaftaran, kirimKodePendaftaran, verifikasiKodePendaftaran } from '../api/persetujuan.api.js';
import { CFG } from '../config.js';
import { initOtpBoxes, readOtp, clearOtp, setOtpError, disableOtp } from '../components/otp-boxes.js';
import { startClock, stopClock, newEnd, savedEnd, mmss } from '../services/otp-clock.js';
import { pendingHTML } from '../components/auth-forms.js';
import { t } from '../core/i18n.js';
import { showSessionsPage } from './admin-sessions.js';
import { renderBottomNav, tabFromHash } from '../components/bottom-nav.js';

/** true setelah password baru berhasil disimpan (supaya layar "password baru" tidak muncul lagi). */
let recoveryHandled = false;

/** Email tujuan kode reset + waktu kirim terakhir (untuk jeda kirim ulang). */
let resetEmail = '';
let lastSent = 0;
const RESEND_MS = 60000;

/**
 * Warna bilah status/alamat browser HP. Di layar masuk dibuat sama dengan biru header,
 * sehingga biru menyatu sampai ke tepi atas layar. Di halaman lain kembali ke warna aplikasi.
 */
const themeMeta = document.querySelector('meta[name="theme-color"]');
const THEME_APP = themeMeta?.content || '#07758f';
const THEME_AUTH = '#1db3d5';
if (themeMeta) {
  new MutationObserver(() => {
    themeMeta.content = document.body.classList.contains('auth-mode') ? THEME_AUTH : THEME_APP;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/**
 * Halaman yang sedang tampil: 'jastiper' (penitip, bawaan saat pertama dibuka) atau 'jastip' (admin).
 * Disimpan di sini supaya layar yang digambar ulang (ganti ke Daftar, Lupa password, dst.) tetap di halaman yang sama.
 */
let pane = 'jastiper';
try { if (sessionStorage.getItem('pane') === 'jastip') pane = 'jastip'; } catch (_) {} // refresh tetap di halaman yang sama


/**
 * Tampilkan layar Masuk / Daftar / Lupa password / Password baru di halaman Jastip,
 * berdampingan dengan halaman Jastiper (penitip). Header aplikasi disembunyikan lewat body.auth-mode.
 * @param {'login'|'signup'|'forgot'|'otp'|'newpass'} mode
 * @param {{email?:string}} [ctx] data tambahan (mis. email tujuan kode)
 */
export function showAuth(mode, ctx = {}) {
  const email = ctx.email || $('#em')?.value || ''; // jangan hilangkan email yang sudah diketik saat pindah layar
  if (mode === 'newpass') pane = 'jastip';          // dari link/kode reset: langsung ke form password baru
  document.body.classList.add('auth-mode');
  app.innerHTML = authScreenHTML(mode, { ...ctx, pane, recent: getRecent() });
  if (email && $('#em')) $('#em').value = email;
  initAuthScroll();
  initPullRefresh();
  renderChangelogBadge(); // isi angka di lonceng
  window.scrollTo(0, 0);
  ready();
}

/** Fungsi easing "berat dulu, lalu meluncur": easeInOutCubic. */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** true jika pengguna meminta animasi dikurangi. */
const diam = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Gulirkan satu wadah dengan animasi manual (snap dimatikan sementara lewat kelas .animating).
 * @param {HTMLElement} el wadah @param {number} to tujuan scrollTop @param {number} dur durasi ms @param {Function} [done]
 */
function glide(el, to, dur, done) {
  const from = el.scrollTop;
  if (diam() || Math.abs(to - from) < 2) { el.scrollTop = to; done?.(); return; }
  const t0 = performance.now();
  el.classList.add('animating');
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el.scrollTop = from + (to - from) * easeInOut(t);
    if (t < 1) requestAnimationFrame(step);
    else { el.classList.remove('animating'); done?.(); }
  };
  requestAnimationFrame(step);
}

/** Halaman (Jastip / Jastiper) yang sedang tampil. */
const paneAktif = () => $('.pane-' + pane);

/** Sinkronkan penanda halaman aktif: data-page (panah), aria-selected (ikon), inert (halaman tersembunyi). */
function tandaiAktif() {
  const a = $('.auth');
  if (!a) return;
  a.dataset.pane = pane;
  $$('.auth-pane').forEach((el) => el.toggleAttribute('inert', !el.classList.contains('pane-' + pane)));
  $$('.sw').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.p === pane)));
  const sc = paneAktif()?.querySelector('.auth-scroll');
  const p1 = paneAktif()?.querySelector('.auth-p1');
  a.dataset.page = sc && p1 && sc.scrollTop / (p1.offsetHeight || 1) > 0.5 ? '2' : '1';
}

/**
 * Gulir halaman yang sedang tampil (khusus HP) ke layar 1 (isi utama) atau 2 (cara kerja + footer).
 * @param {1|2} n layar tujuan
 */
export function setAuthPage(n) {
  const sc = paneAktif()?.querySelector('.auth-scroll');
  const p1 = paneAktif()?.querySelector('.auth-p1');
  if (!sc || !p1) return;
  document.activeElement?.blur?.(); // tutup keyboard kalau sedang terbuka
  glide(sc, n === 2 ? p1.offsetHeight : 0, 800, () =>
    $(n === 2 ? '.auth-prev' : '.auth-next')?.focus({ preventScroll: true })); // fokus ke tombol yang terlihat
}

/**
 * Pindah antara halaman Jastip dan Jastiper (langsung, tanpa animasi scale pada tombol switch).
 * @param {'jastip'|'jastiper'} nama
 */
export function setAuthPane(nama) {
  if (!$('.auth') || nama === pane) return;
  document.activeElement?.blur?.();
  pane = nama;
  try { sessionStorage.setItem('pane', nama); } catch (_) {}
  tandaiAktif();
}

/**
 * Pasang pelacak gulir tegak untuk tiap halaman: menghitung seberapa jauh layar 1 sudah bergeser (0 sampai 1)
 * lalu menyimpannya di variabel CSS --p milik halaman itu (efek scale) dan di data-page (untuk panah).
 * Juga memasang geser mendatar (kiri/kanan) sebagai jalan pintas pindah halaman.
 */
function initAuthScroll() {
  const a = $('.auth');
  if (!a) return;
  $$('.auth-pane').forEach((pn) => {
    const sc = pn.querySelector('.auth-scroll');
    const p1 = pn.querySelector('.auth-p1');
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, sc.scrollTop / (p1.offsetHeight || 1)));
      pn.style.setProperty('--p', p.toFixed(3));
      if (pn === paneAktif()) a.dataset.page = p > 0.5 ? '2' : '1';
    };
    sc.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();

    // geser mendatar cepat = pindah halaman (kiri = Jastiper, kanan = Jastip)
    let x0 = 0; let y0 = 0; let ok = false;
    sc.addEventListener('touchstart', (e) => {
      ok = e.touches.length === 1 && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName);
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    sc.addEventListener('touchend', (e) => {
      if (!ok) return;
      ok = false;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) setAuthPane(dx < 0 ? 'jastiper' : 'jastip');
    }, { passive: true });
  });
  tandaiAktif();
}

/**
 * Tarik layar masuk ke bawah (saat sudah di paling atas) untuk memuat ulang halaman.
 * Pita atas tetap diam; di bawahnya muncul indikator Gacoan (ikon + huruf terisi satu per satu) dan form turun sedikit.
 * Lepas setelah cukup jauh = refresh.
 * Hanya jalan di layar sentuh, hanya untuk gerakan TEGAK (geser mendatar antar halaman tidak terganggu),
 * dan dilewati saat keyboard terbuka supaya isian tidak hilang tidak sengaja.
 */
function initPullRefresh() {
  const a = $('.auth');
  if (!a) return;
  const THRESH = 72;  // jarak tarik minimal (px) agar refresh
  const MAX = 130;    // jarak tarik maksimal
  const HOLD = 64;    // tinggi indikator saat memuat
  const LOCK = 8;     // gerak minimal (px) sebelum arah ditentukan
  let x0 = 0;
  let y0 = null;      // null = tidak sedang menarik
  let arah = '';      // '' belum ditentukan, 'v' tegak, 'h' mendatar
  let pull = 0;
  let loading = false;

  const set = (v) => {
    pull = v;
    a.style.setProperty('--pull', v + 'px');
    a.style.setProperty('--ptr', String(Math.min(1, v / THRESH)));
  };
  const typing = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
  const batal = () => { y0 = null; a.classList.remove('pulling'); if (pull) set(0); };

  $$('.auth-scroll').forEach((sc) => {
    sc.addEventListener('touchstart', (e) => {
      if (loading || typing() || e.target.closest('input,textarea,select') || sc.scrollTop > 0 || e.touches.length !== 1) { y0 = null; return; }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      arah = '';
    }, { passive: true });

    sc.addEventListener('touchmove', (e) => {
      if (y0 === null) return;
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;
      if (!arah) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        arah = Math.abs(dy) > Math.abs(dx) && dy > 0 ? 'v' : 'h';
        if (arah === 'v') a.classList.add('pulling');
      }
      if (arah === 'h' || dy <= 0 || sc.scrollTop > 0) { batal(); arah = 'h'; return; }
      if (e.cancelable) e.preventDefault();             // jangan biarkan browser ikut menarik
      set(Math.min(MAX, dy * 0.5));                     // 0.5 = terasa "berat" ditarik
    }, { passive: false });

    const end = () => {
      if (y0 === null) return;
      y0 = null;
      a.classList.remove('pulling');
      if (pull >= THRESH) {
        loading = true;
        a.classList.add('refreshing');
        set(HOLD);
        a.style.setProperty('--ptr', '1'); // indikator Gacoan penuh lalu mengisi bergantian
        setTimeout(() => location.reload(), 650);
      } else {
        set(0);
      }
    };
    sc.addEventListener('touchend', end);
    sc.addEventListener('touchcancel', end);
  });
}

/** Titik masuk admin: pastikan sudah login, muat profil, lalu pilih halaman. */
export async function showAdmin() {
  const my = ++state.rid;
  // Jangan tampilkan header beranda dulu — tunggu hasil cek sesi (cegah flash)
  state.role = 'admin';
  clearInterval(state.timer);
  state.sesi = null;

  const m = location.hash.match(/^#\/a\/(\w+)/); // #/a/<kode> = detail sesi
  if (m) pane = 'jastip';                          // link admin: tampilkan halaman Jastip kalau perlu masuk
  const session = await getSession();
  if (my !== state.rid) return;
  state.user = session?.user || null;
  state.accessToken = session?.access_token || null;
  if (state.user && OPENED_FROM_RECOVERY_LINK && !recoveryHandled) {
    if (!$('[data-form=newpass]')) showAuth('newpass'); // sudah tampil? jangan hapus yang sedang diketik
    return;
  } // dari link reset
  if (!state.user) {
    if (RESET_LINK_EXPIRED) { pane = 'jastip'; toast('Link reset sudah tidak berlaku. Minta link baru.', 1); }
    showAuth('login');
    return;
  }

  // Belum disetujui developer/Co Jastip: tampilkan halaman Pending/Verified, bukan beranda.
  // (Bila fungsi status belum ada di database, lanjut saja; pembatasan sebenarnya ada di database.)
  if (state.approvedFor !== state.user.id) {
    const ap = await statusPendaftaran(state.user.email);
    if (my !== state.rid) return;
    if (!ap.error && ap.data && ap.data !== 'disetujui') { pane = 'jastip'; await showPending(state.user.email, true, ap.data); return; }
    state.approvedFor = state.user.id;
  }

  // Masih di auth-mode saat muat profil → form login tetap tampil, tidak flash header
  state.profil = (await getProfile(state.user.id)).data;
  if (my !== state.rid) return;

  // Pertama kali masuk: pakai nama yang diisi saat Daftar sebagai nama profil.
  const nama = state.user.user_metadata?.nama;
  if (!state.profil && nama) {
    const s = await saveProfile({ id: state.user.id, nama });
    if (!s.error) state.profil = { id: state.user.id, nama, rek: '', wa: '' };
  }
  if (my !== state.rid) return;
  await markOnline(); // "masuk" -> online (hanya menulis sekali, lihat services/presence.js)
  if (my !== state.rid) return;

  // Baru ganti ke beranda: kosongkan form auth dulu, baru tampilkan header (hindari tumpang tindih)
  app.innerHTML = skeleton;
  document.body.classList.remove('auth-mode');
  renderHeader();
  renderChangelogBadge();
  const tab = tabFromHash(location.hash);
  renderBottomNav(tab); // detail sesi (#/a/..) dan beranda sama-sama menyalakan tab Beranda
  const sub = location.hash.match(/^#\/(buat|aktif|sesi)\/?$/);
  if (m) showSessionDetail(m[1], my);
  else if (sub) showSessionsPage(sub[1], my);
  else if (tab === 'home') showDashboard(my);
  else showTab(tab, my);
}

/** Jeda cek status di layar Pending (ms): lebih rapat dari POLL_MS supaya terasa langsung berubah. */
const PENDING_POLL_MS = 5000;

/**
 * Layar status pendaftaran: Pending sampai developer/Co Jastip menyetujui, lalu Verified + tombol kembali ke masuk.
 * Status dicek ulang berkala (tanpa perlu muat ulang halaman).
 * @param {string} email @param {boolean} hasSession pendaftar sedang login @param {string} [status] status awal (kalau sudah diketahui)
 */
async function showPending(email, hasSession, status) {
  const first = status || (await statusPendaftaran(email)).data || 'menunggu';
  showAuth('pending', { email, status: first, hasSession });
  setupPendingOtp();
  clearInterval(state.timer);
  state.timer = setInterval(() => refreshPending(email, hasSession), PENDING_POLL_MS);
}

/** Cek status; bila berubah, ganti isi layar Pending. Berhenti sendiri kalau layarnya sudah hilang. */
async function refreshPending(email, hasSession) {
  const box = $('#pend');
  if (!box) { clearInterval(state.timer); return; }
  const { data } = await statusPendaftaran(email);
  if (data && data !== box.dataset.status && $('#pend')) {
    $('#pend').outerHTML = pendingHTML({ email, status: data, hasSession });
    setupPendingOtp();
  }
}

/* ------------------------------------------------- Kode verifikasi pendaftaran (6 kotak) */

/** Waktu (ms epoch) kirim ulang boleh lagi. Diisi saat kode pertama tampil dan tiap kali kirim ulang. */
let otpCooldownEnd = 0;
let otpEnd = 0;

/** Pesan galat dari Edge Function -> teks inline. @param {any} err */
function otpErrorText(err) {
  const status = err?.context?.status;
  if (status === 429) return t('pd.otpRate');
  if (status === 404 || /FunctionsFetchError|FunctionsRelayError/.test(err?.name || '')) return t('pd.otpOff');
  return t('pd.otpWrong');
}

/** Perbarui angka timer dan tombol kirim ulang tiap detik. @param {number} left sisa kode (dtk) @param {number} cool sisa jeda (dtk) */
function paintOtpClock(left, cool) {
  const tm = $('#otp-timer');
  const rs = $('#otp-resend');
  if (!tm) { stopClock(); return; } // layar sudah diganti
  tm.textContent = mmss(left);
  tm.classList.toggle('is-low', left > 0 && left <= 30);
  if (rs) {
    rs.disabled = cool > 0;
    rs.textContent = cool > 0 ? t('pd.otpResendIn', { s: cool }) : t('pd.otpResend');
  }
  const f = $('.pd-otp');
  if (f && left === 0 && !f.dataset.expired) { f.dataset.expired = '1'; disableOtp(f, true); setOtpError(f, t('pd.otpExpired')); }
}

/** Pasang perilaku kotak + jam bila layar yang tampil adalah Verified dengan kode. Aman dipanggil kapan saja. */
function setupPendingOtp() {
  const f = $('.pd-otp');
  stopClock();
  if (!f) return;
  const email = $('#pend')?.dataset.email || '';
  initOtpBoxes(f, { onComplete: () => verifyPendingOtp() });
  const saved = savedEnd(email);
  otpEnd = saved || newEnd(email);
  if (!otpCooldownEnd || otpCooldownEnd < Date.now() - 3600000) otpCooldownEnd = Date.now() + CFG.OTP_JEDA_DETIK * 1000;
  startClock({ end: otpEnd, cooldownEnd: otpCooldownEnd, onTick: paintOtpClock });
  $('.otp-box')?.focus();
}

/** Kirim kode 6 digit ke server. Benar -> masuk (atau ke layar masuk bila belum ada sesi). */
export function verifyPendingOtp() {
  return lock(async () => {
    const f = $('.pd-otp');
    const box = $('#pend');
    if (!f || !box) return;
    const kode = readOtp(f);
    if (f.dataset.expired) { setOtpError(f, t('pd.otpExpired')); return; }
    if (kode.length < 6) { setOtpError(f, t('pd.otpIncomplete')); return; }
    setOtpError(f);
    setBusy('.pd-otp .auth-btn', t('pd.otpChecking'));
    let r;
    try { r = await verifikasiKodePendaftaran(box.dataset.email, kode); } catch (err) { r = { error: err }; }
    if (r.error || r.data?.ok === false) {
      setBusy('.pd-otp .auth-btn');
      setOtpError(f, r.error ? otpErrorText(r.error) : t('pd.otpWrong'));
      clearOtp(f);
      return;
    }
    stopClock();
    if (box.dataset.session) { toast(t('pd.otpDone')); state.approvedFor = null; showAdmin(); return; }
    toast(t('pd.otpDoneLogin'));
    await backToLogin();
  });
}

/** Kirim ulang kode (aktif setelah jeda). */
export function resendPendingOtp() {
  return lock(async () => {
    const f = $('.pd-otp');
    const box = $('#pend');
    if (!f || !box || Date.now() < otpCooldownEnd) return;
    let r;
    try { r = await kirimKodePendaftaran(box.dataset.email); } catch (err) { r = { error: err }; }
    if (r.error) { setOtpError(f, otpErrorText(r.error)); return; }
    delete f.dataset.expired;
    disableOtp(f, false);
    clearOtp(f);
    setOtpError(f);
    otpEnd = newEnd(box.dataset.email);
    otpCooldownEnd = Date.now() + CFG.OTP_JEDA_DETIK * 1000;
    startClock({ end: otpEnd, cooldownEnd: otpCooldownEnd, onTick: paintOtpClock });
    toast(t('pd.otpSent'));
  });
}

/** Tombol "Kembali ke masuk" (dan "Keluar" saat Pending): keluar dari akun lalu buka layar masuk. */
export async function backToLogin() {
  clearInterval(state.timer);
  try { await signOut(); } catch (_) { /* tidak ada sesi: langsung ke layar masuk */ }
  state.approvedFor = null;
  showAdmin();
}

/** Terjemahkan pesan galat Supabase yang umum ke bahasa Indonesia. */
function authError(err, isSignUp) {
  const m = err?.message || '';
  if (isSignUp && /database error/i.test(m)) return 'Pendaftaran gagal diproses server. Coba lagi, atau hubungi developer.';
  if (/invalid login credentials/i.test(m)) return 'Email atau password salah.';
  if (/email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk (dan Spam), ketuk link konfirmasinya.';
  if (/already registered|already been registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.';
  if (/otp.*(expired|invalid)|token.*(expired|invalid)|expired.*token|invalid.*token/i.test(m)) return 'Kode salah atau sudah kedaluwarsa. Minta kode baru.';
  if (/rate limit|too many|security purposes/i.test(m)) return 'Terlalu sering mencoba. Tunggu sebentar lalu coba lagi.';
  if (/password should be at least|weak password/i.test(m)) return 'Password terlalu pendek atau lemah (min 6 karakter).';
  if (/invalid email|unable to validate email/i.test(m)) return 'Format email tidak valid.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Tidak ada koneksi internet. Coba lagi.';
  return m || 'Terjadi kesalahan. Coba lagi.';
}

/**
 * Masuk atau daftar memakai isian form.
 * @param {boolean} isSignUp true = daftar akun baru, false = masuk
 */
export function authenticate(isSignUp) {
  return lock(async () => {
    const nama = isSignUp ? $('#nm').value.trim() : '';
    const e = $('#em').value.trim();
    const p = $('#pw').value;
    const alasan = isSignUp ? $('#al').value.trim() : '';
    if (isSignUp && !nama) { toast('Isi nama dulu', 1); $('#nm').focus(); return; }
    if (isSignUp && alasan.length < 5) { toast(t('su.reasonNeeded'), 1); $('#al').focus(); return; }
    if (!e || p.length < 6) { toast('Isi email dan password (min 6 karakter)', 1); return; }

    setBusy('.auth-btn', isSignUp ? 'Mendaftar…' : 'Masuk…'); // beri tanda sedang diproses
    let r;
    try {
      r = isSignUp ? await signUp(e, p, nama, alasan) : await signIn(e, p);
    } catch (err) {
      r = { error: err }; // jaringan putus: tampilkan pesan, jangan diam
    }
    if (r.error) {
      setBusy('.auth-btn');
      toast(authError(r.error, isSignUp), 1);
      return;
    }
    if (isSignUp) { pane = 'jastip'; await showPending(e, Boolean(r.data.session)); return; } // daftar -> halaman Pending
    showAdmin();
  });
}

/** Keluar dari akun lalu tampilkan layar masuk. */
export async function logout() {
  await markOffline(); // "keluar" -> offline (sebelum signOut, selagi masih bisa menulis profil sendiri)
  await signOut();
  pane = 'jastip'; // setelah keluar, tetap di halaman Jastip
  showAdmin();
}

/**
 * Tombol mata: tampilkan / sembunyikan isi kolom password.
 * @param {HTMLElement} b tombol mata yang diketuk
 */
export function togglePassword(b) {
  const input = b.closest('.auth-field').querySelector('input');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  b.setAttribute('aria-pressed', String(show));
  b.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
}

/** Tombol "Forgot password?" / "Ganti" email: buka layar lupa password. */
export const forgotPassword = () => showAuth('forgot', { email: $('#em') ? '' : resetEmail });

/** Minta kode ke email. Dipakai oleh form lupa password dan tombol "Kirim ulang". */
async function requestCode(email) {
  setBusy('.auth-btn', 'Mengirim…');
  let r;
  try { r = await sendResetEmail(email, location.origin + location.pathname); } catch (err) { r = { error: err }; }
  if (r.error) { setBusy('.auth-btn'); toast(authError(r.error), 1); return false; }
  resetEmail = email;
  lastSent = Date.now();
  return true;
}

/** Kirim kode ke email yang diisi, lalu pindah ke layar isi kode. */
export function sendReset() {
  return lock(async () => {
    const e = $('#em').value.trim();
    if (!e) { toast('Isi email dulu', 1); $('#em').focus(); return; }
    if (!(await requestCode(e))) return;
    toast('Kode dikirim. Cek email (termasuk Spam).');
    showAuth('otp', { email: e });
  });
}

/** Kirim ulang kode (jeda 60 detik supaya tidak kena batas Supabase). */
export function resendCode() {
  return lock(async () => {
    if (!resetEmail) { showAuth('forgot'); return; }
    const sisa = Math.ceil((RESEND_MS - (Date.now() - lastSent)) / 1000);
    if (sisa > 0) { toast('Tunggu ' + sisa + ' detik lagi untuk kirim ulang', 1); return; }
    if (!(await requestCode(resetEmail))) return;
    setBusy('.auth-btn');
    toast('Kode baru dikirim');
  });
}

/** Periksa kode dari email. Kalau benar, lanjut ke layar password baru. */
export function verifyCode() {
  return lock(async () => {
    const kode = $('#otp').value.replace(/\D/g, '');
    if (kode.length < 6) { toast('Isi kode dari email (min 6 angka)', 1); $('#otp').focus(); return; }
    setBusy('.auth-btn', 'Memeriksa…');
    let r;
    try { r = await verifyResetCode(resetEmail, kode); } catch (err) { r = { error: err }; }
    if (r.error) { setBusy('.auth-btn'); toast(authError(r.error), 1); return; }
    toast('Kode benar. Buat password baru.');
    showAuth('newpass');
  });
}

/** Simpan password baru (harus sama dengan konfirmasi), lalu masuk ke dashboard. */
export function saveNewPassword() {
  return lock(async () => {
    const p = $('#pw').value;
    if (p.length < 6) { toast('Password minimal 6 karakter', 1); return; }
    if (p !== $('#pw2').value) { toast('Konfirmasi password tidak sama', 1); return; }
    setBusy('.auth-btn', 'Menyimpan…');
    let r;
    try { r = await updatePassword(p); } catch (err) { r = { error: err }; }
    if (r.error) { setBusy('.auth-btn'); toast(authError(r.error), 1); return; }
    recoveryHandled = true;
    toast('Password diubah ✓');
    showAdmin();
  });
}
