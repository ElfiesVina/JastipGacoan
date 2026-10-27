/**
 * js/views/admin-tabs.js
 * Halaman tab bottom nav selain Beranda:
 *   #/admins    List admin jastip (daftar akun + title Co Jastip, khusus developer)
 *   #/approval  Persetujuan pendaftaran admin jastip (belum dibuat, tampil kerangka)
 *   #/settings  Setelan (belum dibuat, tampil kerangka)
 */
import { app } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { POLL_MS } from '../core/constants.js';
import { listJastipProfiles, setCojastip } from '../api/profile.api.js';
import { renderHeader } from '../components/header.js';
import { cojastipPanelHTML } from '../components/cojastip-panel.js';
import { isDeveloperEmail } from '../services/profile-rules.js';

/** Kerangka satu halaman tab. */
const page = (inner) => '<div class="tab-page">' + inner + '</div>';

/** Kartu pesan sederhana (judul + keterangan). */
const messageCard = (title, text) =>
  '<section class="profile-card tab-card"><h2 class="form-title">' + title + '</h2><p class="form-note">' + text + '</p></section>';

/** Daftar akun jastip LAIN (tanpa akun yang sedang login). */
const otherAccounts = (rows) => (rows || []).filter((a) => a.id !== state.user.id);

/** Isi halaman List admin jastip dari daftar akun. */
const listHTML = (rows) => page(cojastipPanelHTML(otherAccounts(rows)));

/** Muat ulang ISI daftar admin saja (dipakai polling dan setelah serah/cabut title). */
async function refreshAdminList(my) {
  const { data } = await listJastipProfiles();
  if (my !== state.rid) return;
  app.innerHTML = listHTML(data);
}

/** Tab List admin jastip. Developer: daftar + tombol serah/cabut. Lainnya: keterangan saja. */
async function showAdminList(my) {
  if (!isDeveloperEmail(state.user?.email)) {
    app.innerHTML = page(messageCard('List admin jastip', 'Daftar ini hanya bisa dilihat dan diatur oleh developer.'));
    return;
  }
  const { data } = await listJastipProfiles();
  if (my !== state.rid) return;
  app.innerHTML = listHTML(data);
  state.timer = setInterval(() => refreshAdminList(my), POLL_MS); // status online ikut hidup tanpa reload
}

/** Tab Persetujuan: kerangka saja sampai alurnya diputuskan. */
const showApproval = () => {
  app.innerHTML = page(messageCard('Persetujuan admin jastip', 'Halaman ini belum aktif. Daftar pendaftar yang menunggu persetujuan akan tampil di sini.'));
};

/** Tab Setelan: kerangka saja sampai isinya diputuskan. */
const showSettings = () => {
  app.innerHTML = page(messageCard('Setelan', 'Halaman ini belum aktif.'));
};

/**
 * Tampilkan tab. @param {'admins'|'approval'|'settings'} tab @param {number} my nomor navigasi
 */
export async function showTab(tab, my = state.rid) {
  state.sesi = null;
  clearInterval(state.timer);
  window.scrollTo(0, 0);
  renderHeader();
  if (tab === 'admins') await showAdminList(my);
  else if (tab === 'approval') showApproval();
  else showSettings();
}

/** Serahkan/cabut title Co Jastip (tombol di daftar), lalu muat ulang daftar. */
export function toggleCojastip(button) {
  return lock(async () => {
    const { id, value } = button.dataset;
    const { error } = await setCojastip(id, value === '1');
    if (error) { toast(error.message || 'Gagal mengubah title Co Jastip.', 1); return; }
    await refreshAdminList(state.rid);
  });
}
