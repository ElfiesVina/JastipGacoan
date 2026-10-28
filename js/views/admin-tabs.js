/**
 * js/views/admin-tabs.js
 * Halaman tab bottom nav selain Beranda:
 *   #/admins    List admin jastip (daftar akun + title Co Jastip, khusus developer)
 *   #/approval  Persetujuan pendaftaran (developer dan Co Jastip)
 *   #/settings  Setelan: bahasa dan tema
 */
import { app, esc } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { POLL_MS } from '../core/constants.js';
import { t, LANGS, getLang, setLang } from '../core/i18n.js';
import { listJastipProfiles, setCojastip } from '../api/profile.api.js';
import { listPermintaan, putuskanPermintaan } from '../api/persetujuan.api.js';
import { renderHeader } from '../components/header.js';
import { cojastipPanelHTML } from '../components/cojastip-panel.js';
import { PROFILE_ICON } from '../components/profile-icons.js';
import { isDeveloperEmail } from '../services/profile-rules.js';

/** Kerangka halaman tab. */
const page = (inner) => '<div class="tab-page">' + inner + '</div>';

/** Kartu pesan sederhana (judul + keterangan). */
const messageCard = (title, text) =>
  '<section class="profile-card tab-card"><h2 class="form-title">' + title + '</h2><p class="form-note">' + text + '</p></section>';

const isDeveloper = () => isDeveloperEmail(state.user?.email);
/** Developer atau Co Jastip: boleh menyetujui pendaftaran (server mengecek lagi, lihat is_approver()). */
const isApprover = () => isDeveloper() || Boolean(state.profil?.cojastip);

/* ---------------------------------------------------------------- List admin */

/** Daftar akun jastip LAIN (tanpa akun yang sedang login). */
const otherAccounts = (rows) => (rows || []).filter((a) => a.id !== state.user.id);

/** Muat ulang ISI daftar admin saja (dipakai polling dan setelah serah/cabut title). */
async function refreshAdminList(my) {
  const { data } = await listJastipProfiles();
  if (my !== state.rid) return;
  app.innerHTML = page(cojastipPanelHTML(otherAccounts(data)));
}

/** Tab List admin jastip. Developer: daftar + tombol serah/cabut. Lainnya: keterangan saja. */
async function showAdminList(my) {
  if (!isDeveloper()) { app.innerHTML = page(messageCard(t('al.title'), t('al.devOnly'))); return; }
  await refreshAdminList(my);
  if (my !== state.rid) return;
  state.timer = setInterval(() => refreshAdminList(my), POLL_MS); // status online ikut hidup tanpa reload
}

/** Serahkan/cabut title Co Jastip (tombol di daftar), lalu muat ulang daftar. */
export function toggleCojastip(button) {
  return lock(async () => {
    const { id, value } = button.dataset;
    const { error } = await setCojastip(id, value === '1');
    if (error) { toast(error.message || t('al.fail'), 1); return; }
    await refreshAdminList(state.rid);
  });
}

/* ---------------------------------------------------------------- Persetujuan */

/** Satu kartu pengajuan: nama, email, pesan, tanggal, tombol Setujui/Tolak. */
function requestHTML(r) {
  const date = new Date(r.dibuat).toLocaleDateString(getLang() === 'ar' ? 'ar' : getLang() === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    '<li class="request-row"><div class="request-who"><b>' + esc(r.nama) + '</b><small>' + esc(r.email) + '</small>' +
    (r.alasan ? '<p class="request-msg"><b>' + t('ap.reason') + ':</b> ' + esc(r.alasan) + '</p>' : '') + '<small class="request-date">' + esc(date) + '</small></div>' +
    '<div class="request-actions">' +
    '<button type="button" class="profile-button-primary cojastip-btn" data-act="req-approve" data-id="' + esc(r.id) + '" data-email="' + esc(r.email) + '">' + t('ap.approve') + '</button>' +
    '<button type="button" class="profile-button-ghost cojastip-btn" data-act="req-reject" data-id="' + esc(r.id) + '">' + t('ap.reject') + '</button></div></li>'
  );
}

/** Muat dan gambar daftar pengajuan yang menunggu. */
async function refreshApprovals(my) {
  const { data, error } = await listPermintaan();
  if (my !== state.rid) return;
  const rows = Array.isArray(data) ? data : [];
  app.innerHTML = page(
    '<section class="profile-card tab-card"><h2 class="form-title">' + t('ap.title') + '</h2><p class="form-note">' + t('ap.lead') + '</p>' +
    (error ? '<p class="form-note">' + t('ap.loadFail') + '</p>'
      : rows.length ? '<ul class="cojastip-list">' + rows.map(requestHTML).join('') + '</ul>' : '<p class="form-note">' + t('ap.empty') + '</p>') +
    '</section>');
}

/** Tab Persetujuan. */
async function showApproval(my) {
  if (!isApprover()) { app.innerHTML = page(messageCard(t('ap.title'), t('ap.devOnly'))); return; }
  await refreshApprovals(my);
}

/** Setujui / tolak pengajuan (tombol di kartu). @param {HTMLElement} button @param {boolean} approve */
function decide(button, approve) {
  return lock(async () => {
    const { error } = await putuskanPermintaan(button.dataset.id, approve);
    if (error) { toast(error.message || t('ap.fail'), 1); return; }
    toast(approve ? t('ap.approved', { email: button.dataset.email }) : t('ap.rejected'));
    await refreshApprovals(state.rid);
  });
}
export const approveRequest = (button) => decide(button, true);
export const rejectRequest = (button) => decide(button, false);

/* ---------------------------------------------------------------- Setelan */

/** Tab Setelan: pilihan bahasa dan tombol ganti tema. */
function showSettings() {
  const current = getLang();
  const langs = LANGS.map((l) =>
    '<button type="button" class="lang-option' + (l.code === current ? ' is-active' : '') + '" role="radio" aria-checked="' + (l.code === current) + '" ' +
    'data-act="set-lang" data-lang="' + l.code + '" lang="' + l.code + '"><span>' + l.name + '</span>' + (l.code === current ? PROFILE_ICON.check : '') + '</button>').join('');
  app.innerHTML = page(
    '<section class="profile-card tab-card"><h2 class="form-title">' + t('st.lang') + '</h2><p class="form-note">' + t('st.langNote') + '</p>' +
    '<div class="lang-list" role="radiogroup" aria-label="' + esc(t('st.lang')) + '">' + langs + '</div></section>' +
    '<section class="profile-card tab-card"><h2 class="form-title">' + t('st.theme') + '</h2><p class="form-note">' + t('st.themeNote') + '</p>' +
    '<button type="button" class="profile-button-ghost theme-switch" data-act="theme">' + t('st.themeBtn') + '</button></section>');
}

/** Pilih bahasa: simpan, lalu gambar ulang halaman yang sedang dibuka. @param {HTMLElement} button */
export function chooseLanguage(button) {
  if (!setLang(button.dataset.lang)) return;
  window.dispatchEvent(new HashChangeEvent('hashchange')); // router menggambar ulang halaman aktif dengan bahasa baru
}

/* ---------------------------------------------------------------- Pintu masuk */

/**
 * Tampilkan tab. @param {'admins'|'approval'|'settings'} tab @param {number} my nomor navigasi
 */
export async function showTab(tab, my = state.rid) {
  state.sesi = null;
  clearInterval(state.timer);
  window.scrollTo(0, 0);
  renderHeader();
  if (tab === 'admins') await showAdminList(my);
  else if (tab === 'approval') await showApproval(my);
  else showSettings();
}
