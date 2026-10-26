/**
 * js/views/admin-dashboard.js
 * Beranda jastip: kartu profil, lalu (bila profil lengkap) navigasi, sesi aktif, buat sesi, sesi saya.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { newCode } from '../core/format.js';
import { addRecent } from '../core/recent.js';
import { listMySesi, createSesi, listOrderStates } from '../api/sesi.api.js';
import { renderHeader } from '../components/header.js';
import { dashboardHTML } from '../components/dashboard.js';
import { profileCardHTML } from '../components/profile-card.js';
import { profileFormHTML } from '../components/profile-form.js';
import { isProfileComplete } from '../services/profile-rules.js';
import { countSessions, isActiveSession, summarizeOrders } from '../services/dashboard-stats.js';
import { isEditingProfile } from './admin-profile.js';

/** Nama bawaan bila profil belum punya nama: bagian depan email akun. */
const fallbackName = () => (state.user?.email || 'Admin Jastip').split('@')[0];

/** Tampilkan beranda. @param {number} my nomor navigasi (untuk membuang respons yang telat) */
export async function showDashboard(my) {
  state.sesi = null;
  renderHeader();
  const complete = isProfileComplete(state.profil);
  const { data, error } = complete ? await listMySesi() : { data: [], error: null };
  if (my !== state.rid) return;

  const activeSessions = (data || []).filter(isActiveSession);
  const orderRows = activeSessions.length ? (await listOrderStates(activeSessions.map((s) => s.id))).data : [];
  if (my !== state.rid) return;

  const profileHTML = isEditingProfile()
    ? profileFormHTML(state.profil, fallbackName())
    : profileCardHTML({ profile: state.profil, displayName: fallbackName(), stats: countSessions(data) });
  app.innerHTML = dashboardHTML({
    profileHTML, complete: complete && !isEditingProfile(), sessions: data, error, activeSessions,
    orderSummary: summarizeOrders(orderRows),
  });
}

/** Gulir halus ke bagian beranda (CTA navigasi). */
export function scrollToSection(button) {
  const target = document.getElementById(button.dataset.target);
  if (!target) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/**
 * Buat sesi baru lalu buka halamannya.
 * Jika kode acak kebetulan bentrok (error 23505), coba ulang sampai 3 kali.
 */
export function createSession() {
  return lock(async () => {
    let r;
    for (let t = 0; t < 3; t++) {
      r = await createSesi({ kode: newCode(), owner: state.user.id, judul: $('#jd').value.trim() || 'Titipan Gacoan' });
      if (!r.error || r.error.code !== '23505') break;
    }
    if (r.error) { toast(r.error.message, 1); return; }
    addRecent(r.data.kode, r.data.judul); // muncul di halaman Jastiper sebagai pintasan
    location.hash = '#/a/' + r.data.kode;
  });
}
