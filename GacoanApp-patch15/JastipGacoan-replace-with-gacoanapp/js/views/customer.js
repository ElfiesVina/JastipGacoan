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
import { addRecent } from '../core/recent.js';
import { POLL_MS, LS_NAME, LS_LAST } from '../core/constants.js';
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

/** Buka sesi dari isian di halaman Jastiper: boleh link lengkap (…#/s/kode) atau kodenya saja. */
export function joinSession() {
  const v = ($('#kd')?.value || '').trim();
  const m = v.match(/#\/s\/(\w+)/) || v.match(/^(\w+)$/);
  if (!m) { toast('Tempel link atau kode dari jastip', 1); $('#kd')?.focus(); return; }
  location.hash = '#/s/' + m[1];
}

/** Buka lagi sesi terakhir (tombol di halaman Jastiper). @param {HTMLElement} b */
export function openLast(b) {
  if (/^\w+$/.test(b.dataset.k || '')) location.hash = '#/s/' + b.dataset.k;
}

/** Langkah status sesi untuk pita kemajuan di atas halaman. */
const LANGKAH = [['open', 'Daftar dibuka'], ['closed', 'Belanja'], ['settled', 'Rekap & bayar']];

/** HTML pita kemajuan: langkah yang sudah lewat bertanda centang, yang sekarang disorot. @param {string} st */
function stepperHTML(st) {
  const now = LANGKAH.findIndex((x) => x[0] === st);
  return '<ol class="stp" aria-label="Tahap sesi">' + LANGKAH.map((x, i) =>
    '<li class="' + (i < now ? 'pas' : i === now ? 'now' : '') + '"' + (i === now ? ' aria-current="step"' : '') + '><span class="dot">' +
    (i < now ? '✓' : i + 1) + '</span><span class="lbl">' + x[1] + '</span></li>').join('') + '</ol>';
}

/**
 * Titik masuk halaman penitip: reset keadaan, tampilkan skeleton, muat data, gambar.
 * @param {string} k kode sesi dari URL
 */
export async function showCustomer(k) {
  const my = ++state.rid;
  document.body.classList.remove('auth-mode');
  document.body.classList.add('cust-mode');
  state.role = 'penitip';
  state.sesi = null; state.pesanan = []; state.built = ''; state.sig = '';
  renderHeader();
  renderChangelogBadge();
  app.innerHTML = skeleton;

  const hasil = await loadCustomerData(k);
  if (my !== state.rid) return; // pengguna sudah pindah halaman, abaikan

  if (hasil === 'err') {
    app.innerHTML = '<div class="card ctr"><h2>Gagal memuat</h2><p class="mu">Periksa koneksi internet, lalu coba lagi.</p><button type="button" data-act="retry">Coba lagi</button></div>';
    return;
  }
  if (hasil === 'none') {
    app.innerHTML = '<div class="card ctr"><h2>Link tidak ditemukan</h2><p class="mu">Minta jastip mengirim ulang linknya, atau periksa kodenya.</p><a class="btn" href="#/">Kembali ke beranda</a></div>';
    return;
  }
  addRecent(k, state.sesi.judul); // pintasan di halaman Jastiper
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
    app.innerHTML = '<div class="cust"><div id="s" class="cs"></div><div class="cc1"><div id="f"></div><div id="p"></div></div><div class="cc2"><div id="k"></div><div id="l"></div></div></div>';
    $('#s').innerHTML = stepperHTML(st);
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
