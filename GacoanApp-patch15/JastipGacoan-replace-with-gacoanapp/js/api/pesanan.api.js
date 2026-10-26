/**
 * js/api/pesanan.api.js
 * Pesanan (titipan). Dua jalur seperti sesi.api.js.
 */
import { sb } from './client.js';

/* ---------- Jalur PUBLIK (penitip) ---------- */

/** Daftar pesanan sebuah sesi berdasarkan kode. */
export const listPublicPesanan = (k) => sb.rpc('list_pesanan', { k });

/**
 * Tambah pesanan. Server mengembalikan true/false (false = ditutup/penuh/tidak valid).
 * @param {string} k kode sesi @param {string} n nama @param {string} i item @param {string} l level
 */
export const addPesanan = (k, n, i, l) => sb.rpc('tambah_pesanan', { k, n, i, l });

/**
 * Tandai sudah bayar (+ link bukti opsional).
 * @param {string} k kode sesi @param {string} n nama @param {string|null} b URL bukti
 */
export const markPaid = (k, n, b) => sb.rpc('tandai_bayar', { k, n, b });

/* ---------- Jalur PEMILIK (admin) ---------- */

/** Daftar pesanan sebuah sesi berdasarkan id sesi (urut waktu). */
export const listOwnerPesanan = (sesiId) =>
  sb.from('pesanan').select('*').eq('sesi_id', sesiId).order('created_at');

/** Hapus satu pesanan. */
export const deletePesanan = (id) => sb.from('pesanan').delete().eq('id', id);

/** Ubah status lunas untuk beberapa pesanan sekaligus. @param {string[]} ids @param {boolean} paid */
export const setPaid = (ids, paid) => sb.from('pesanan').update({ paid }).in('id', ids);
