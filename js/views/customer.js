/**
 * js/views/customer.js
 * Halaman PENITIP (tanpa login), dibuka lewat link  #/s/<kode>.
 * Alur: muat sesi -> tampilkan form titip -> sesi ditutup -> rekap terbit -> bayar.
 */
import { app, $, esc } from '../core/dom.js';
import { state, draft } from '../core/state.js';
import { store } from '../core/storage.js';
import { toast, setBusy, lock, skeleton } from '../core/ui.js';
import { isMie, rp, waLink, key } from '../core/format.js';
import { POLL_MS, LS_NAME } from '../core/constants.js';
import { getPublicSesi } from '../api/sesi.api.js';
import { listPublicPesanan, addPesanan, markPaid } from '../api/pesanan.api.js';
import { uploadBukti } from '../api/bukti.api.js';
import { shrink } from '../services/image.js';
import { hitungRekap } from '../services/calc.js';
import { renderChangelogBadge } from '../services/changelog.js';
import { renderHeader } from '../components/header.js';
import { orderListHTML } from '../components/order-list.js';
import { recapCardHTML } from '../components/recap-card.js';
import { orderFormHTML, payFormHTML, syncChoice, syncWho } from '../components/customer-forms.js';

/**
 * Muat sesi + pesanan ke `state`.
 * @param {string} k kode sesi
 * @returns {Promise<'ok'|'none'|'err'>} ok = berhasil, none = kode tidak ada, err = gagal jaringan/server
 */
async function loadCustomerData(k) {
  const [a, b] = await Promise.all([getPublicSesi(k), listPublicPesanan(k)]);
  if (a.error || b.error) return 'err';
  if (!a.data) return 'none';
  state.sesi = { ...a.data, kode: k };
  state.pesanan = b.data || [];
  return 'ok';
}

/**
 * Titik masuk halaman penitip: reset keadaan, tampilkan skeleton, muat data, gambar.
 * @param {string} k kode sesi dari URL
 */
export async function showCustomer(k) {
  const my = ++state.rid;
  state.role = 'penitip';
  state.sesi = null; state.pesanan = []; state.built = ''; state.sig = '';
  renderHeader();
  renderChangelogBadge();
  app.innerHTML = skeleton;

  const hasil = await loadCustomerData(k);
  if (my !== state.rid) return; // pengguna sudah pindah halaman, abaikan

  if (hasil === 'err') {
    app.innerHTML = '<div class="card"><h2>Gagal memuat</h2><p class="mu">Periksa koneksi internet, lalu coba lagi.</p><button type="button" data-act="retry">Coba lagi</button></div>';
    return;
  }
  if (hasil === 'none') {
    app.innerHTML = '<div class="card"><h2>Link tidak ditemukan</h2><p class="mu">Minta jastip mengirim ulang linknya.</p></div>';
    return;
  }
  drawCustomer();
  state.timer = setInterval(() => pollCustomer(k, my), POLL_MS);
}

/**
 * Cek data terbaru berkala. Dilewati jika tab tersembunyi, ada aksi berjalan,
 * polling sebelumnya belum selesai, atau pengguna sudah pindah halaman.
 */
export async function pollCustomer(k, my) {
  if (document.hidden || state.busy || state.polling || my !== state.rid) return;
  state.polling = true;
  try {
    if ((await loadCustomerData(k)) === 'ok' && my === state.rid) drawCustomer();
  } finally {
    state.polling = false;
  }
}

/** Segarkan data begitu tab kembali terlihat. */
export function refreshWhenVisible() {
  if (!document.hidden && state.role === 'penitip' && state.sesi) pollCustomer(state.sesi.kode, state.rid);
}

/**
 * Gambar halaman sesuai status sesi.
 * Kerangka (form) hanya dibangun SEKALI per status supaya yang sedang diketik tidak hilang;
 * daftar & rekap digambar ulang hanya jika datanya berubah (dicek lewat `sig`).
 */
export function drawCustomer() {
  renderHeader();
  const st = state.sesi.status;

  if (state.built !== st) {
    state.built = st;
    state.sig = '';
    app.innerHTML = '<div id="f"></div><div id="l"></div><div id="k"></div><div id="p"></div>';
    if (st === 'open') {
      $('#f').innerHTML = orderFormHTML();
      syncChoice();
    } else if (st === 'closed') {
      $('#f').innerHTML = '<div class="card note"><h2>Daftar ditutup</h2><p class="mu" style="margin:0">Jastip sedang belanja. Rekap dan info transfer muncul di sini setelah harga masuk.</p></div>';
    } else {
      $('#p').innerHTML = payFormHTML();
      syncWho();
    }
  }

  const sg = JSON.stringify([state.sesi, state.pesanan]);
  if (sg === state.sig) return; // tidak ada perubahan
  state.sig = sg;
  $('#l').innerHTML = orderListHTML(false);
  $('#k').innerHTML = st === 'settled' ? recapCardHTML() : '';
}

/** Kirim titipan baru. Dikunci agar tidak terkirim dua kali. */
export function submitOrder() {
  return lock(async () => {
    const n = draft.n.trim();
    const i = draft.i;
    if (!n) { toast('Isi nama dulu', 1); $('#n').focus(); return; }
    if (!i) { toast('Pilih pesanan dulu', 1); return; }

    setBusy('#go', 'Mengirim…');
    const l = isMie(i) ? draft.l : '';
    store.set(LS_NAME, n);

    const r = await addPesanan(state.sesi.kode, n, i, l);
    if (r.error) { setBusy('#go'); toast('Gagal mengirim. Coba lagi.', 1); return; }

    const ok = (await loadCustomerData(state.sesi.kode)) === 'ok';
    setBusy('#go');
    if (ok && state.sesi.status !== 'open') { drawCustomer(); toast('Daftar sudah ditutup jastip', 1); return; }
    if (r.data === false) { toast('Tidak bisa menambah: daftar penuh atau isian tidak valid', 1); return; }

    draft.i = ''; draft.l = '';
    syncChoice();
    toast('Masuk ke daftar ✓');
    if (ok) drawCustomer();
  });
}

/** Catat pembayaran: unggah foto bukti (opsional) lalu tandai lunas. */
export function submitPayment() {
  return lock(async () => {
    const g = hitungRekap().grup.find((x) => key(x.nama) === draft.who);
    if (!g) { toast('Pilih namamu dulu', 1); return; }

    setBusy('#pay', 'Mengirim…');
    let bukti = null;
    let peringatan = false;
    if (draft.f) {
      try {
        const { blob, ext } = await shrink(draft.f);
        bukti = await uploadBukti(state.sesi.kode + '/' + crypto.randomUUID() + '.' + ext, blob);
      } catch {
        peringatan = true; // lanjut tanpa foto
      }
    }

    const r = await markPaid(state.sesi.kode, g.nama, bukti);
    if (r.error) { setBusy('#pay'); toast('Gagal mencatat. Coba lagi.', 1); return; }

    draft.f = null;
    await loadCustomerData(state.sesi.kode);
    if (state.sesi) drawCustomer();

    $('#p').innerHTML =
      '<div class="card done"><h2>Tercatat lunas ✓</h2><p class="mu">Terima kasih, ' + esc(g.nama) + '.' +
      (peringatan ? ' Foto bukti gagal terunggah, kirim lewat WA ya.' : '') + '</p>' +
      (state.sesi.wa
        ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(waLink(state.sesi.wa, 'Halo, saya ' + g.nama + ' sudah transfer ' + rp(g.sum) + ' untuk titipan Gacoan.')) + '">Kabari jastip lewat WA</a>'
        : '') + '</div>';
  });
}
