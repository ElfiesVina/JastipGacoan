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
