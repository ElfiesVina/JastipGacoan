/**
 * js/services/image.js
 * Pengecil foto bukti sebelum diunggah (hemat kuota & cepat).
 */
import { MAX_IMG_SIDE } from '../core/constants.js';

/**
 * Kecilkan foto ke sisi terpanjang MAX_IMG_SIDE lalu simpan sebagai JPEG.
 * Jika gagal (browser lama, file aneh), kembalikan file aslinya.
 * @param {File} f file foto
 * @returns {Promise<{blob:Blob, ext:string}>}
 */
export async function shrink(f) {
  try {
    const bm = await createImageBitmap(f);
    const s = Math.min(1, MAX_IMG_SIDE / Math.max(bm.width, bm.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bm.width * s);
    c.height = Math.round(bm.height * s);
    c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
    if (blob) return { blob, ext: 'jpg' };
  } catch { /* lanjut ke cadangan */ }
  return { blob: f, ext: (f.type.split('/')[1] || 'jpg').replace(/\W/g, '') };
}
