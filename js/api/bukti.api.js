/**
 * js/api/bukti.api.js
 * Unggah foto bukti transfer ke Supabase Storage.
 */
import { sb } from './client.js';
import { BUCKET } from '../core/constants.js';

/**
 * Unggah foto lalu kembalikan URL publiknya.
 * Melempar error jika gagal (pemanggil yang menangkap).
 * @param {string} path lokasi di bucket, mis. "kode/uuid.jpg"
 * @param {Blob} blob isi file
 * @returns {Promise<string>} URL publik
 */
export async function uploadBukti(path, blob) {
  const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
  if (up.error) throw up.error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
