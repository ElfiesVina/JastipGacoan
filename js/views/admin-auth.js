/**
 * js/views/admin-auth.js
 * Pintu masuk area jastip/admin (#/ dan #/a/<kode>): cek login,
 * tampilkan form masuk, atau teruskan ke dashboard / detail sesi.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { getSession, signIn, signUp, signOut } from '../api/auth.api.js';
import { getProfile } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { loginHTML } from '../components/admin-forms.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { showDashboard } from './admin-dashboard.js';
import { showSessionDetail } from './admin-session.js';

/** Titik masuk admin: pastikan sudah login, muat profil, lalu pilih halaman. */
export async function showAdmin() {
  const my = ++state.rid;
  state.role = 'admin';
  clearInterval(state.timer);
  state.sesi = null;
  renderHeader();
  renderChangelogBadge();

  const m = location.hash.match(/^#\/a\/(\w+)/); // #/a/<kode> = detail sesi
  const session = await getSession();
  if (my !== state.rid) return;
  state.user = session?.user || null;
  if (!state.user) { app.innerHTML = loginHTML(); return; }

  state.profil = (await getProfile(state.user.id)).data;
  if (my !== state.rid) return;
  m ? showSessionDetail(m[1], my) : showDashboard(my);
}

/**
 * Masuk atau daftar memakai isian form login.
 * @param {boolean} isSignUp true = daftar akun baru, false = masuk
 */
export function authenticate(isSignUp) {
  return lock(async () => {
    const e = $('#em').value.trim();
    const p = $('#pw').value;
    if (!e || p.length < 6) { toast('Isi email dan password (min 6 karakter)', 1); return; }

    const r = isSignUp ? await signUp(e, p) : await signIn(e, p);
    if (r.error) {
      toast(isSignUp && /database error/i.test(r.error.message) ? 'Email ini belum diizinkan jadi jastip. Hubungi admin.' : r.error.message, 1);
      return;
    }
    if (isSignUp && !r.data.session) { toast('Cek email untuk konfirmasi, lalu masuk'); return; }
    showAdmin();
  });
}

/** Keluar dari akun lalu tampilkan form login. */
export async function logout() {
  await signOut();
  showAdmin();
}
