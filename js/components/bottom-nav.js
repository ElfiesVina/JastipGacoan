/**
 * js/components/bottom-nav.js
 * Navigasi bawah (bottom nav) untuk area jastip: Beranda, Admin, Persetujuan, Setelan.
 * Memakai tautan hash biasa (<a href="#/...">), jadi tidak butuh event tambahan.
 * Disembunyikan lewat CSS di layar masuk (body.auth-mode) dan halaman penitip (body.cust-mode).
 */
import { PROFILE_ICON } from './profile-icons.js';
import { t } from '../core/i18n.js';

/** Urutan tab. `key` dipakai untuk menandai tab aktif (lihat showAdmin di views/admin-auth.js). */
const ITEMS = [
  { key: 'home', href: '#/', label: 'nav.home', icon: 'home' },
  { key: 'admins', href: '#/admins', label: 'nav.admins', icon: 'users' },
  { key: 'approval', href: '#/approval', label: 'nav.approval', icon: 'userCheck' },
  { key: 'settings', href: '#/settings', label: 'nav.settings', icon: 'settings' },
];

/** Hash -> kunci tab. #/a/<kode> (detail sesi) dan #/ dianggap tab Beranda. @param {string} hash */
export function tabFromHash(hash) {
  const m = String(hash || '').match(/^#\/(admins|approval|settings)\/?$/);
  return m ? m[1] : 'home';
}

/** Gambar (atau perbarui) bottom nav. @param {string} active kunci tab yang menyala */
export function renderBottomNav(active) {
  let nav = document.getElementById('bnav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'bnav';
    nav.className = 'bnav';
    
    document.body.append(nav);
  }
  nav.setAttribute('aria-label', t('nav.aria'));
  nav.innerHTML = '<ul class="bnav-list">' + ITEMS.map((item) =>
    '<li><a class="bnav-item' + (item.key === active ? ' is-active' : '') + '" href="' + item.href + '"' +
    (item.key === active ? ' aria-current="page"' : '') + '>' +
    PROFILE_ICON[item.icon] + '<span>' + t(item.label) + '</span></a></li>').join('') + '</ul>';
  document.body.classList.add('has-bnav');
}
