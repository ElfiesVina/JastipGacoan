/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan layar Masuk/Daftar, atau teruskan ke dashboard / detail sesi.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock, skeleton, setBusy } from '../core/ui.js';
import { getSession, signIn, signUp, signOut, sendResetEmail, updatePassword } from '../api/auth.api.js';
import { OPENED_FROM_RECOVERY_LINK, RESET_LINK_EXPIRED } from '../api/client.js';
import { getProfile, saveProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { authScreenHTML } from '../components/auth-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';

/** true setelah password baru berhasil disimpan (supaya layar "password baru" tidak muncul lagi). */
let recoveryHandled = false;

/**
 * Tampilkan layar Masuk / Daftar / Lupa password / Password baru
 * (header aplikasi disembunyikan lewat body.auth-mode).
 * @param {'login'|'signup'|'forgot'|'newpass'} mode
 */
export function showAuth(mode) {
  const email = $('#em')?.value || ''; // jangan hilangkan email yang sudah diketik saat pindah layar
  document.body.classList.add('auth-mode');
  app.innerHTML = authScreenHTML(mode);
  if (email && $('#em')) $('#em').value = email;
  renderChangelogBadge(); // isi titik di lonceng
  window.scrollTo(0, 0);
}

/** Titik masuk admin: pastikan sudah login, muat profil, lalu pilih halaman. */
export async function showAdmin() {
  const my = ++state.rid;
  // Jangan tampilkan header beranda dulu — tunggu hasil cek sesi (cegah flash)
  state.role = 'admin';
  clearInterval(state.timer);
  state.sesi = null;

  const m = location.hash.match(/^#\/a\/(\w+)/); // #/a/<kode> = detail sesi
  const session = await getSession();
  if (my !== state.rid) return;
  state.user = session?.user || null;
  if (state.user && OPENED_FROM_RECOVERY_LINK && !recoveryHandled) {
    if (!$('[data-form=newpass]')) showAuth('newpass'); // sudah tampil? jangan hapus yang sedang diketik
    return;
  } // dari link reset
  if (!state.user) {
    if (RESET_LINK_EXPIRED) toast('Link reset sudah tidak berlaku. Minta link baru.', 1);
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

/** Tombol "Forgot password?": buka layar lupa password. */
export const forgotPassword = () => showAuth('forgot');

/** Kirim email berisi link reset ke alamat yang diisi, lalu kembali ke layar Masuk. */
export function sendReset() {
  return lock(async () => {
    const e = $('#em').value.trim();
    if (!e) { toast('Isi email dulu', 1); $('#em').focus(); return; }
    setBusy('.auth-btn', 'Mengirim…');
    let r;
    try { r = await sendResetEmail(e, location.origin + location.pathname); } catch (err) { r = { error: err }; }
    if (r.error) { setBusy('.auth-btn'); toast(authError(r.error), 1); return; }
    toast('Link dikirim. Cek email (termasuk Spam), lalu ketuk linknya.');
    showAuth('login');
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
