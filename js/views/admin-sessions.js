/**
 * js/views/admin-sessions.js
 * Halaman sesi yang dibuka dari kartu pintasan beranda:
 *   #/buat  buat sesi baru   #/aktif  sesi aktif   #/sesi  semua sesi saya
 */
import { app } from '../core/dom.js';
import { state } from '../core/state.js';
import { t } from '../core/i18n.js';
import { listMySesi, listOrderStates } from '../api/sesi.api.js';
import { renderHeader } from '../components/header.js';
import { PROFILE_ICON } from '../components/profile-icons.js';
import { activeListHTML, createSessionHTML, mySessionsHTML } from '../components/dashboard.js';
import { isProfileComplete } from '../services/profile-rules.js';
import { isActiveSession, summarizeOrders } from '../services/dashboard-stats.js';

/** Kerangka halaman: tautan kembali ke beranda + isi. */
const page = (inner) =>
  '<div class="tab-page"><a class="back-link" href="#/">' + PROFILE_ICON.chevron + '<span>' + t('nav.home') + '</span></a>' + inner + '</div>';

/**
 * @param {'buat'|'aktif'|'sesi'} kind halaman yang dibuka @param {number} my nomor navigasi
 */
export async function showSessionsPage(kind, my) {
  state.sesi = null;
  clearInterval(state.timer);
  window.scrollTo(0, 0);
  renderHeader();
  if (!isProfileComplete(state.profil)) { location.hash = '#/'; return; } // profil belum lengkap: balik ke beranda
  if (kind === 'buat') { app.innerHTML = page(createSessionHTML()); return; }

  const { data, error } = await listMySesi();
  if (my !== state.rid) return;
  if (kind === 'sesi') { app.innerHTML = page(mySessionsHTML(data, error)); return; }

  const active = (data || []).filter(isActiveSession);
  const orders = active.length ? (await listOrderStates(active.map((s) => s.id))).data : [];
  if (my !== state.rid) return;
  app.innerHTML = page(activeListHTML(active, summarizeOrders(orders)));
}
