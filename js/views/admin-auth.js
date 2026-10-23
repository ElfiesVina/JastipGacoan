/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan layar Masuk/Daftar, atau teruskan ke dashboard / detail sesi.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { getSession, signIn, signUp, signOut, sendResetEmail, verifyRecoveryCode, updatePassword } from '../api/auth.api.js';
import { OPENED_FROM_RECOVERY_LINK, RESET_LINK_EXPIRED } from '../api/client.js';
import { getProfile, saveProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { authScreenHTML } from '../components/auth-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';

/** true setelah password baru berhasil disimpan (supaya layar "password baru" tidak muncul lagi). */
let recoveryHandled = false;

/** Email yang sedang direset; dibawa antar layar (email -> kode -> password baru). */
let resetEmail = '';

/**
 * Tampilkan layar Masuk / Daftar / Lupa password / Kode / Password baru
 * (header aplikasi disembunyikan lewat body.auth-mode).
 * @param {'login'|'signup'|'forgot'|'code'|'newpass'} mode
 * @param {{email?:string}} [ctx] data tambahan untuk layar (mis. email di layar kode)
 */
export function showAuth(mode, ctx = {}) {
  document.body.classList.add('auth-mode');
  app.innerHTML = authScreenHTML(mode, ctx);
  renderChangelogBadge(); // isi titik di lonceng
  window.scrollTo(0, 0);
}

/** Titik masuk admin: pastikan sudah login, muat profil, lalu pilih halaman. */
export async function showAdmin() {
  const my = ++state.rid;
  document.body.classList.remove('auth-mode');
  state.role = 'admin';
  clearInterval(state.timer);
  state.sesi = null;
  renderHeader();
  renderChangelogBadge();

  const m = location.hash.match(/^#\/a\/(\w+)/); // #/a/<kode> = detail sesi
  const session = await getSession();
  if (my !== state.rid) return;
  state.user = session?.user || null;
  if (state.user && OPENED_FROM_RECOVERY_LINK && !recoveryHandled) { showAuth('newpass'); return; } // dari link reset
  if (!state.user) {
    if (RESET_LINK_EXPIRED) toast('Link reset sudah tidak berlaku. Minta link baru.', 1);
    showAuth('login');
    return;
  }

  state.profil = (await getProfile(state.user.id)).data;
  if (my !== state.rid) return;

  // Pertama kali masuk: pakai nama yang diisi saat Daftar sebagai nama profil.
  const nama = state.user.user_metadata?.nama;
  if (!state.profil && nama) {
    const s = await saveProfile({ id: state.user.id, nama });
    if (!s.error) state.profil = { id: state.user.id, nama, rek: '', wa: '' };
  }
  m ? showSessionDetail(m[1], my) : showDashboard(my);
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

    const r = isSignUp ? await signUp(e, p, nama) : await signIn(e, p);
    if (r.error) {
      toast(isSignUp && /database error/i.test(r.error.message) ? 'Email ini belum diizinkan jadi jastip. Hubungi admin.' : r.error.message, 1);
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

/** Langkah 1: kirim kode reset ke email yang diisi, lalu buka layar kode. */
export function sendReset() {
  return lock(async () => {
    const e = $('#em').value.trim();
    if (!e) { toast('Isi email dulu', 1); $('#em').focus(); return; }
    const r = await sendResetEmail(e);
    if (r.error) { toast(r.error.message, 1); return; }
    resetEmail = e;
    toast('Kode dikirim. Cek email (termasuk Spam).');
    showAuth('code', { email: e });
  });
}

/** Kirim ulang kode ke email yang sama (Supabase membatasi ±1 kali per menit). */
export function resendCode() {
  return lock(async () => {
    if (!resetEmail) { showAuth('forgot'); return; }
    const r = await sendResetEmail(resetEmail);
    if (r.error) { toast(r.error.message, 1); return; }
    toast('Kode baru dikirim');
  });
}

/** Langkah 2: cocokkan kode. Jika benar, lanjut ke layar password baru. */
export function verifyCode() {
  return lock(async () => {
    const c = $('#cd').value.replace(/\s/g, '');
    if (!/^\d{6,10}$/.test(c)) { toast('Masukkan kode angka dari email', 1); $('#cd').focus(); return; }
    const r = await verifyRecoveryCode(resetEmail, c);
    if (r.error) { toast('Kode salah atau sudah kedaluwarsa', 1); return; }
    toast('Kode benar ✓');
    showAuth('newpass');
  });
}

/** Langkah 3: simpan password baru (harus sama dengan konfirmasi), lalu masuk ke dashboard. */
export function saveNewPassword() {
  return lock(async () => {
    const p = $('#pw').value;
    if (p.length < 6) { toast('Password minimal 6 karakter', 1); return; }
    if (p !== $('#pw2').value) { toast('Konfirmasi password tidak sama', 1); return; }
    const r = await updatePassword(p);
    if (r.error) { toast(r.error.message, 1); return; }
    recoveryHandled = true;
    resetEmail = '';
    toast('Password diubah ✓');
    showAdmin();
  });
}
