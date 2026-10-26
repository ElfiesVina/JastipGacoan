/**
 * js/api/sesi.api.js
 * Sesi jastip. Ada dua jalur:
 *  - PUBLIK (penitip, tanpa login)  : getPublicSesi  -> RPC get_sesi
 *  - PEMILIK (admin, sudah login)   : fungsi lainnya -> tabel `sesi` (dilindungi RLS)
 */
import { sb } from './client.js';

/** [Publik] Ambil data sesi berdasarkan kode, sudah digabung profil jastip. */
export const getPublicSesi = (k) => sb.rpc('get_sesi', { k });

/** [Admin] Daftar sesi milik saya, terbaru dulu. */
export const listMySesi = () =>
  sb.from('sesi').select('id,kode,judul,status,tgl').order('created_at', { ascending: false });

/** [Admin] Ambil satu sesi lengkap berdasarkan kode. */
export const getMySesi = (k) => sb.from('sesi').select('*').eq('kode', k).maybeSingle();

/** [Admin] Buat sesi baru. @param {{kode,owner,judul}} row */
export const createSesi = (row) => sb.from('sesi').insert(row).select().single();

/** [Admin] Ubah kolom sesi. @param {string} id id sesi @param {object} patch kolom yang diubah */
export const updateSesi = (id, patch) => sb.from('sesi').update(patch).eq('id', id);

/** [Admin] Status bayar semua pesanan pada sesi-sesi tertentu (untuk ringkasan di beranda). @param {string[]} ids id sesi */
export const listOrderStates = (ids) => sb.from('pesanan').select('sesi_id,paid').in('sesi_id', ids);
