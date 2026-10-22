/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan layar Masuk/Daftar, atau teruskan ke dashboard / detail sesi.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { getSession, signIn, signUp, signOut } from '../api/auth.api.js';
import { getProfile, saveProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { authScreenHTML } from '../components/auth-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';

/**
 * Tampilkan layar Masuk atau Daftar (header aplikasi disembunyikan lewat body.auth-mode).
 * @param {'login'|'signup'} mode
 */
export function showAuth(mode) {
  document.body.classList.add('auth-mode');
  app.innerHTML = authScreenHTML(mode);
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
  if (!state.user) { showAuth('login'); return; }

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

/** "Forgot password?" — belum tersedia (butuh layar atur-password-baru + backend). */
export const forgotPassword = () => toast('Fitur lupa password belum tersedia', 1);
