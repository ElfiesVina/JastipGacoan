/**
 * js/api/profile.api.js
 * Profil jastip: nama, info transfer (rek), nomor WA.
 */
import { sb } from './client.js';

/** Ambil profil milik pengguna. @param {string} id id pengguna. @returns {Promise<{data,error}>} */
export const getProfile = (id) => sb.from('profiles').select('*').eq('id', id).maybeSingle();

/** Simpan (insert/update) profil. @param {{id,nama,rek,wa}} row. @returns {Promise<{data,error}>} */
export const saveProfile = (row) => sb.from('profiles').upsert(row);
