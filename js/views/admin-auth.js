/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan layar Masuk/Daftar, atau teruskan ke dashboard / detail sesi.
 */
import { app, $, $$ } from '../core/dom.js';
import { state } from '../core/state.js';
import { store } from '../core/storage.js';
import { LS_LAST } from '../core/constants.js';
import { toast, lock, skeleton, setBusy } from '../core/ui.js';
import { getSession, signIn, signUp, signOut, sendResetEmail, updatePassword, verifyResetCode } from '../api/auth.api.js';
import { OPENED_FROM_RECOVERY_LINK, RESET_LINK_EXPIRED } from '../api/client.js';
import { getProfile, saveProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { authScreenHTML } from '../components/auth-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';

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
 * Halaman geser yang sedang tampil: 'jastiper' (penitip, bawaan saat pertama dibuka) atau 'jastip' (admin).
 * Disimpan di sini supaya layar yang digambar ulang (ganti ke Daftar, Lupa password, dst.) tetap di halaman yang sama.
 */
let pane = 'jastiper';

/** Sesi terakhir yang dibuka penitip di perangkat ini, atau null. */
function lastSession() {
  try {
    const v = JSON.parse(store.get(LS_LAST) || 'null');
    return v && /^\w+$/.test(v.k || '') ? { k: v.k, j: String(v.j || '').slice(0, 60) } : null;
  } catch {
    return null;
  }
}

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
  app.innerHTML = authScreenHTML(mode, { ...ctx, pane, last: lastSession() });
  if (email && $('#em')) $('#em').value = email;
  initAuthDeck();
  initAuthScroll();
  initPullRefresh();
  renderChangelogBadge(); // isi angka di lonceng
  window.scrollTo(0, 0);
}

/** Fungsi easing "berat dulu, lalu meluncur": easeInOutCubic. */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** true jika pengguna meminta animasi dikurangi. */
const diam = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Gulirkan satu wadah dengan animasi manual (snap dimatikan sementara lewat kelas .animating).
 * @param {HTMLElement} el wadah @param {'scrollTop'|'scrollLeft'} prop arah @param {number} to tujuan
 * @param {number} dur durasi ms @param {Function} [done] dipanggil setelah selesai
 */
function glide(el, prop, to, dur, done) {
  const from = el[prop];
  if (diam() || Math.abs(to - from) < 2) { el[prop] = to; done?.(); return; }
  const t0 = performance.now();
  el.classList.add('animating');
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el[prop] = from + (to - from) * easeInOut(t);
    if (t < 1) requestAnimationFrame(step);
    else { el.classList.remove('animating'); done?.(); }
  };
  requestAnimationFrame(step);
}

/**
 * Gulir halaman Jastip (khusus HP) ke halaman 1 (form) atau 2 (cara kerja + footer).
 * @param {1|2} n halaman tujuan
 */
export function setAuthPage(n) {
  const sc = $('.pane-jastip .auth-scroll');
  const p1 = $('.auth-p1');
  if (!sc || !p1) return;
  document.activeElement?.blur?.(); // tutup keyboard kalau sedang terbuka
  glide(sc, 'scrollTop', n === 2 ? p1.offsetHeight : 0, 800, () =>
    $(n === 2 ? '.auth-prev' : '.auth-next')?.focus({ preventScroll: true })); // fokus ke tombol yang terlihat
}

/**
 * Pindah antara halaman Jastip dan Jastiper (ketuk tab / tautan). Digeser dengan animasi + snap.
 * @param {'jastip'|'jastiper'} nama
 */
export function setAuthPane(nama) {
  const dk = $('.auth-deck');
  if (!dk) return;
  document.activeElement?.blur?.();
  pane = nama;
  glide(dk, 'scrollLeft', nama === 'jastiper' ? dk.scrollWidth - dk.clientWidth : 0, 560);
}

/** Pendengar resize layar auth yang aktif (diganti tiap layar digambar ulang). */
let onResize = () => {};

/**
 * Pasang pelacak geser mendatar: menjaga posisi halaman (termasuk saat layar diputar/di-resize),
 * mengisi variabel CSS --x (0 = Jastip, 1 = Jastiper) untuk penanda tab, dan mengunci halaman yang tidak terlihat (inert).
 */
function initAuthDeck() {
  const dk = $('.auth-deck');
  const a = $('.auth');
  if (!dk || !a) return;
  const lebar = () => Math.max(1, dk.scrollWidth - dk.clientWidth);
  const tandai = () => {
    const x = Math.min(1, Math.max(0, dk.scrollLeft / lebar()));
    a.style.setProperty('--x', x.toFixed(3));
    const nama = x > 0.5 ? 'jastiper' : 'jastip';
    if (a.dataset.pane !== nama) a.dataset.pane = nama;
    if (!dk.classList.contains('animating')) pane = nama;
    $$('.auth-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.p === nama)));
    $('.pane-jastip')?.toggleAttribute('inert', nama !== 'jastip');
    $('.pane-jastiper')?.toggleAttribute('inert', nama !== 'jastiper');
  };
  let raf = 0;
  dk.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tandai(); }); }, { passive: true });
  // taruh langsung di halaman awal (tanpa animasi, sebelum tergambar)
  dk.style.scrollSnapType = 'none';
  dk.scrollLeft = pane === 'jastiper' ? lebar() : 0;
  dk.style.scrollSnapType = '';
  tandai();
  // layar diputar / jendela diubah: tetap di halaman yang sama
  removeEventListener('resize', onResize);
  onResize = () => {
    const d = $('.auth-deck');
    if (!d) { removeEventListener('resize', onResize); return; } // layar sudah diganti halaman lain
    d.scrollLeft = pane === 'jastiper' ? d.scrollWidth - d.clientWidth : 0;
    tandai();
  };
  addEventListener('resize', onResize);
}

/**
 * Pasang pelacak gulir tegak halaman Jastip: menghitung seberapa jauh halaman 1 sudah bergeser (0 sampai 1)
 * lalu menyimpannya di variabel CSS --p (efek scale) dan di data-page (untuk tombol panah).
 */
function initAuthScroll() {
  const sc = $('.pane-jastip .auth-scroll');
  const a = $('.auth');
  const p1 = $('.auth-p1');
  if (!sc || !a || !p1) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, sc.scrollTop / (p1.offsetHeight || 1)));
    a.style.setProperty('--p', p.toFixed(3));
    a.dataset.page = p > 0.5 ? '2' : '1';
  };
  sc.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/**
 * Tarik layar masuk ke bawah (saat sudah di paling atas) untuk memuat ulang halaman.
 * Biru header "memanjang" mengikuti jari, muncul indikator putar; lepas setelah cukup jauh = refresh.
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
      if (loading || typing() || sc.scrollTop > 0 || e.touches.length !== 1) { y0 = null; return; }
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
  if (state.user && OPENED_FROM_RECOVERY_LINK && !recoveryHandled) {
    if (!$('[data-form=newpass]')) showAuth('newpass'); // sudah tampil? jangan hapus yang sedang diketik
    return;
  } // dari link reset
  if (!state.user) {
    if (RESET_LINK_EXPIRED) { pane = 'jastip'; toast('Link reset sudah tidak berlaku. Minta link baru.', 1); }
    showAuth('login');
    return;
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

  // Baru ganti ke beranda: kosongkan form auth dulu, baru tampilkan header (hindari tumpang tindih)
  app.innerHTML = skeleton;
  document.body.classList.remove('auth-mode');
  renderHeader();
  renderChangelogBadge();
  m ? showSessionDetail(m[1], my) : showDashboard(my);
}

/** Terjemahkan pesan galat Supabase yang umum ke bahasa Indonesia. */
function authError(err, isSignUp) {
  const m = err?.message || '';
  if (isSignUp && /database error/i.test(m)) return 'Email ini belum diizinkan jadi jastip. Hubungi admin.';
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
    if (isSignUp && !nama) { toast('Isi nama dulu', 1); $('#nm').focus(); return; }
    if (!e || p.length < 6) { toast('Isi email dan password (min 6 karakter)', 1); return; }

    setBusy('.auth-btn', isSignUp ? 'Mendaftar…' : 'Masuk…'); // beri tanda sedang diproses
    let r;
    try {
      r = isSignUp ? await signUp(e, p, nama) : await signIn(e, p);
    } catch (err) {
      r = { error: err }; // jaringan putus: tampilkan pesan, jangan diam
    }
    if (r.error) {
      setBusy('.auth-btn');
      toast(authError(r.error, isSignUp), 1);
      return;
    }
    if (isSignUp && !r.data.session) { toast('Cek email untuk konfirmasi, lalu masuk'); showAuth('login'); return; }
    showAdmin();
  });
}

/** Keluar dari akun lalu tampilkan layar masuk. */
export async function logout() {
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
