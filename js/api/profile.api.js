/**
 * js/api/profile.api.js
 * Profil jastip: nama, info transfer (rek), nomor WA, serta foto, title, kampus, kutipan, sosmed, e-wallet, bank, status online.
 */
import { sb } from './client.js';

/** Ambil profil milik pengguna. @param {string} id id pengguna. @returns {Promise<{data,error}>} */
export const getProfile = (id) => sb.from('profiles').select('*').eq('id', id).maybeSingle();

/** Simpan (insert/update) profil. @param {{id,nama,rek,wa}} row. @returns {Promise<{data,error}>} */
export const saveProfile = (row) => sb.from('profiles').upsert(row);

/**
 * Simpan perubahan profil lalu kembalikan baris yang BENAR-BENAR tersimpan di database
 * (dipakai sebagai satu-satunya sumber untuk memperbarui tampilan).
 * @param {string} id id pengguna @param {object} patch kolom yang diubah
 */
export const updateProfile = (id, patch) =>
  sb.from('profiles').upsert({ id, ...patch }).select().single();

/**
 * [Developer saja] Daftar semua akun jastip (nama, email, title Co Jastip, status online),
 * untuk panel "Kelola Co Jastip". Server menolak (mengembalikan daftar kosong) kalau akun yang
 * memanggil bukan developer — lihat fungsi list_jastip_profiles() di database.
 */
export const listJastipProfiles = () => sb.rpc('list_jastip_profiles');

/**
 * [Developer saja] Serahkan atau cabut title Co Jastip dari satu akun. Server menolak permintaan
 * ini kalau pemanggilnya bukan developer — lihat fungsi set_cojastip() di database.
 * @param {string} targetId id akun tujuan @param {boolean} value true = jadikan Co Jastip
 */
export const setCojastip = (targetId, value) => sb.rpc('set_cojastip', { target: targetId, value });
