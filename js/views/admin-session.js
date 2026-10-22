/**
 * js/views/admin-session.js
 * Detail satu sesi untuk admin: bagikan link, tutup daftar, isi harga,
 * terbitkan rekap, hapus pesanan, centang lunas.
 */
import { app, $, $$ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { POLL_MS, ARM_MS } from '../core/constants.js';
import { getMySesi, updateSesi } from '../api/sesi.api.js';
import { listOwnerPesanan, deletePesanan, setPaid } from '../api/pesanan.api.js';
import { hitungRekap, linkSesi } from '../services/calc.js';
import { key } from '../core/format.js';
import { renderHeader } from '../components/header.js';
import { orderListHTML } from '../components/order-list.js';
import { sessionDetailHTML } from '../components/admin-forms.js';

/** Ambil pesanan sesi aktif (jalur pemilik). @returns {Promise<Array|null>} */
async function fetchOwnerOrders() {
  return (await listOwnerPesanan(state.sesi.id)).data;
}

/**
 * Muat sesi + pesanan, lalu gambar.
 * @param {string} k kode sesi @param {number} [my] nomor navigasi
 */
export async function showSessionDetail(k, my = state.rid) {
  const r = await getMySesi(k);
  if (my !== state.rid) return;
  if (!r.data) {
    app.innerHTML = '<div class="card">Sesi tidak ditemukan. <a href="#/">Kembali</a></div>';
    return;
  }
  state.sesi = { ...r.data, nama: state.profil?.nama, rek: state.profil?.rek, wa: state.profil?.wa };
  state.pesanan = (await fetchOwnerOrders()) || [];
  if (my !== state.rid) return;
  drawSession();
}

/** Gambar halaman detail dan pasang polling jika sesi masih dibuka. */
export function drawSession() {
  clearInterval(state.timer);
  renderHeader();
  app.innerHTML = sessionDetailHTML();
  state.sig = JSON.stringify(state.pesanan);
  if (state.sesi.status === 'open') state.timer = setInterval(pollSession, POLL_MS);
}

/** Cek pesanan baru berkala; hanya menggambar ulang daftar jika ada perubahan. */
async function pollSession() {
  if (document.hidden || state.busy) return;
  const d = await fetchOwnerOrders();
  if (!d || !state.sesi || state.sesi.status !== 'open') return;
  const sg = JSON.stringify(d);
  if (sg === state.sig) return;
  state.sig = sg;
  state.pesanan = d;
  const l = $('#l');
  if (l) l.innerHTML = orderListHTML(true);
}

/** Muat ulang halaman detail (tombol "Segarkan"). */
export const reloadSession = () => showSessionDetail(state.sesi.kode);

/** Ubah status sesi (open / closed / settled). @param {string} status status tujuan */
export function setStatus(status) {
  return lock(async () => {
    const r = await updateSesi(state.sesi.id, { status });
    if (r.error) { toast(r.error.message, 1); return; }
    await reloadSession();
  });
}

/**
 * Terbitkan rekap: validasi harga semua menu, pajak (0-100) dan fee (>= 0),
 * lalu simpan dan ubah status ke 'settled'.
 */
export function publishRecap() {
  return lock(async () => {
    const prices = {};
    let bad = false;
    $$('[data-p]').forEach((e) => {
      const v = +e.value;
      if (!(v > 0)) bad = true;
      prices[e.dataset.p] = v;
    });
    if (bad) { toast('Isi harga semua menu dulu', 1); return; }

    const pajak = +$('#pj').value;
    const fee = +$('#fe').value || 0;
    if (!(pajak >= 0 && pajak <= 100)) { toast('Pajak harus 0 sampai 100', 1); return; }
    if (fee < 0) { toast('Fee tidak boleh minus', 1); return; }

    const r = await updateSesi(state.sesi.id, { status: 'settled', prices, pajak, fee: Math.round(fee) });
    if (r.error) { toast(r.error.message, 1); return; }
    await reloadSession();
  });
}

/**
 * Hapus pesanan dengan dua ketukan: ketukan pertama mengubah tombol jadi "Hapus?",
 * ketukan kedua (dalam ARM_MS) benar-benar menghapus.
 * @param {HTMLElement} b tombol ✕ yang diketuk
 */
export async function deleteOrder(b) {
  if (!b.dataset.arm) {
    b.dataset.arm = '1';
    b.dataset.t = b.textContent;
    b.classList.add('arm');
    b.textContent = 'Hapus?';
    setTimeout(() => {
      if (b.isConnected) { delete b.dataset.arm; b.classList.remove('arm'); b.textContent = b.dataset.t; }
    }, ARM_MS);
    return;
  }
  return lock(async () => {
    const r = await deletePesanan(b.dataset.id);
    if (r.error) { toast(r.error.message, 1); return; }
    state.pesanan = state.pesanan.filter((o) => o.id !== b.dataset.id);
    state.sig = JSON.stringify(state.pesanan);
    $('#l').innerHTML = orderListHTML(true);
    toast('Dihapus');
  });
}

/** Centang / batalkan lunas semua pesanan satu orang. @param {string} k kunci nama (huruf kecil) */
export function togglePaid(k) {
  return lock(async () => {
    const g = hitungRekap().grup.find((x) => key(x.nama) === k);
    if (!g) return;
    const ids = g.os.map((o) => o.id);
    const v = !g.paid;
    const r = await setPaid(ids, v);
    if (r.error) { toast(r.error.message, 1); return; }
    state.pesanan.forEach((o) => { if (ids.includes(o.id)) o.paid = v; });
    $('#l').innerHTML = orderListHTML(true);
  });
}

/** Salin link sesi ke clipboard. */
export async function copyLink() {
  try {
    await navigator.clipboard.writeText(linkSesi());
    toast('Link disalin ✓');
  } catch {
    toast('Salin manual dari kotak di atas', 1);
  }
}
