/**
 * js/views/admin-dashboard.js
 * Dashboard jastip: profil, buat sesi baru, daftar sesi saya.
 */
import { app, $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { addRecent } from '../core/recent.js';
import { toast, lock } from '../core/ui.js';
import { newCode, normalizePhone } from '../core/format.js';
import { getProfile, saveProfile as saveProfileApi } from '../api/profile.api.js';
import { listMySesi, createSesi } from '../api/sesi.api.js';
import { renderHeader } from '../components/header.js';
import { dashboardHTML } from '../components/admin-forms.js';

/** Tampilkan dashboard. @param {number} my nomor navigasi (untuk membuang respons yang telat) */
export async function showDashboard(my) {
  state.sesi = null;
  renderHeader();
  const { data, error } = await listMySesi();
  if (my !== state.rid) return;
  app.innerHTML = dashboardHTML(data, error);
}

/** Simpan profil jastip. Nomor WA dibersihkan (angka saja, awalan 0 -> 62). */
export function saveProfile() {
  return lock(async () => {
    const wa = normalizePhone($('#pwa').value);
    const r = await saveProfileApi({ id: state.user.id, nama: $('#pn').value.trim(), rek: $('#pr').value.trim(), wa });
    if (r.error) { toast(r.error.message, 1); return; }
    $('#pwa').value = wa;
    toast('Profil tersimpan ✓');
    state.profil = (await getProfile(state.user.id)).data;
  });
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
