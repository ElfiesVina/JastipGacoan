/**
 * js/components/cojastip-panel.js
 * Panel "List admin jastip" (tab Admin di bottom nav) — hanya terlihat & terisi untuk akun developer (lihat
 * services/profile-rules.js isDeveloperEmail). Menyerahkan/mencabut title Co Jastip ke akun lain.
 */
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';

/** Satu baris akun: nama, email, pil status online, tombol serah/cabut. */
function rowHTML(account) {
  const state = account.online ? 'is-online' : 'is-offline';
  const label = account.online ? t('p.online') : t('p.offline');
  const action = account.cojastip
    ? '<button type="button" class="profile-button-ghost cojastip-btn" data-act="cojastip-toggle" data-id="' + esc(account.id) + '" data-value="0">' + t('al.revoke') + '</button>'
    : '<button type="button" class="profile-button-primary cojastip-btn" data-act="cojastip-toggle" data-id="' + esc(account.id) + '" data-value="1">' + t('al.make') + '</button>';
  return (
    '<li class="cojastip-row">' +
    '<span class="cojastip-who"><b>' + esc(account.nama || account.email) + '</b><small>' + esc(account.email) + '</small></span>' +
    '<span class="profile-status ' + state + '">' + label + '</span>' +
    (account.cojastip ? '<span class="cojastip-tag">Co Jastip</span>' : '') +
    action + '</li>'
  );
}

/**
 * @param {Array<{id:string,email:string,nama:string,cojastip:boolean,online:boolean}>} accounts
 *   daftar akun jastip LAIN (di luar developer sendiri, sudah dikeluarkan sebelum dipanggil)
 */
export function cojastipPanelHTML(accounts) {
  const list = (accounts || []).length
    ? '<ul class="cojastip-list">' + accounts.map(rowHTML).join('') + '</ul>'
    : '<p class="form-note">' + t('al.empty') + '</p>';
  return (
    '<section class="profile-card cojastip-panel">' +
    '<h2 class="form-title">' + t('al.title') + '</h2>' +
    '<p class="form-note">' + t('al.note') + '</p>' +
    list + '</section>'
  );
}
