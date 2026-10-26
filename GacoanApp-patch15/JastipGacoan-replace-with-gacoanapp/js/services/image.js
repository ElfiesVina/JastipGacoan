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

/**
 * Potong tengah jadi persegi lalu kecilkan ke `side` px (JPEG). Hasilnya data URL kecil untuk foto profil.
 * @param {File} file foto @param {number} [side] sisi akhir (px)
 * @returns {Promise<string>} data URL, atau '' bila gagal
 */
export async function squareAvatar(file, side = 256) {
  try {
    const bitmap = await createImageBitmap(file);
    const crop = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    canvas.getContext('2d').drawImage(
      bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, side, side,
    );
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return '';
  }
}
