/**
 * js/services/presence.js
 * Status Online/Offline otomatis mengikuti sesi login — tidak lagi diatur manual lewat form.
 * "Masuk" (login / sesi dipulihkan saat buka halaman) -> online. "Keluar" (tombol Keluar,
 * atau menutup tab) -> offline.
 */
import { CFG } from '../config.js';
import { state } from '../core/state.js';
import { updateProfile } from '../api/profile.api.js';

/**
 * Tandai ONLINE. Dipanggil dari showAdmin() setelah profil dimuat. Hanya menulis ke database
 * kalau statusnya BELUM online, supaya tidak menulis berulang setiap kali pindah halaman
 * (showAdmin dipanggil lagi tiap navigasi di area admin).
 */
export async function markOnline() {
  if (!state.user || !state.profil || state.profil.online === true) return;
  const { data, error } = await updateProfile(state.user.id, { online: true });
  if (!error && data) state.profil = data;
}

/** Tandai OFFLINE. Dipanggil sebelum keluar akun (logout). */
export async function markOffline() {
  if (!state.user) return;
  try { await updateProfile(state.user.id, { online: false }); } catch { /* diamkan: sudah mau keluar */ }
}

/**
 * Usaha terbaik menandai OFFLINE saat tab/jendela benar-benar ditutup (bukan cuma pindah tab —
 * itu sudah ditangani visibilitychange di tempat lain). `fetch` biasa gampang terputus begitu
 * halaman mulai menutup; opsi `keepalive` membuat browser tetap mengirim permintaan singkat ini
 * di latar belakang walau halamannya sudah hilang. Dipasang SEKALI dari main.js.
 */
export function armOfflineOnClose() {
  addEventListener('pagehide', () => {
    if (!state.user || !state.accessToken) return;
    try {
      fetch(CFG.URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(state.user.id), {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: CFG.KEY,
          Authorization: 'Bearer ' + state.accessToken,
        },
        body: JSON.stringify({ online: false }),
      });
    } catch { /* usaha terbaik saja — tidak ada tab lagi untuk menampilkan galat */ }
  });
}
