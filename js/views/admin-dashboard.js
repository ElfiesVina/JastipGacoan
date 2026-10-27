/**
 * js/views/admin-dashboard.js
 * Beranda jastip: kartu profil dan kartu pintasan (Buat Sesi, Sesi Aktif, Sesi Saya) yang membuka halamannya sendiri.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { newCode } from '../core/format.js';
import { addRecent } from '../core/recent.js';
import { listMySesi, createSesi } from '../api/sesi.api.js';
import { renderHeader } from '../components/header.js';
import { dashboardHTML } from '../components/dashboard.js';
import { profileCardHTML } from '../components/profile-card.js';
import { profileFormHTML } from '../components/profile-form.js';
import { isProfileComplete } from '../services/profile-rules.js';
import { countSessions, isActiveSession } from '../services/dashboard-stats.js';
import { isEditingProfile } from './admin-profile.js';

/** Nama bawaan bila profil belum punya nama: bagian depan email akun. */
const fallbackName = () => (state.user?.email || 'Admin Jastip').split('@')[0];

/** Tampilkan beranda. @param {number} my nomor navigasi (untuk membuang respons yang telat) */
export async function showDashboard(my) {
  state.sesi = null;
  clearInterval(state.timer); // showDashboard bisa dipanggil berkali-kali tanpa ganti hash (simpan, batal, dst.)
  renderHeader();
  const complete = isProfileComplete(state.profil);
  const { data } = complete ? await listMySesi() : { data: [], error: null };
  if (my !== state.rid) return;

  const activeCount = (data || []).filter(isActiveSession).length;

  const profileHTML = isEditingProfile()
    ? profileFormHTML(state.profil, fallbackName())
    : profileCardHTML({
      profile: state.profil, displayName: fallbackName(), stats: countSessions(data), email: state.user?.email,
    });
  app.innerHTML = dashboardHTML({ profileHTML, complete: complete && !isEditingProfile(), activeCount });
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
