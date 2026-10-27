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

/**
 * Potong tengah jadi POTRET 3:4 lalu kecilkan ke width x height px (JPEG). Hasilnya data URL kecil
 * untuk foto profil (cocok dengan kotak foto potret di kartu profil).
 * @param {File} file foto @param {number} [width] lebar akhir (px) @param {number} [height] tinggi akhir (px)
 * @returns {Promise<string>} data URL, atau '' bila gagal
 */
export async function portraitAvatar(file, width = 240, height = 320) {
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = width / height;
    // ambil bagian tengah foto dengan perbandingan yang sama dengan kotak tujuan
    let cropW = bitmap.width;
    let cropH = cropW / ratio;
    if (cropH > bitmap.height) { cropH = bitmap.height; cropW = cropH * ratio; }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(
      bitmap, (bitmap.width - cropW) / 2, (bitmap.height - cropH) / 2, cropW, cropH, 0, 0, width, height,
    );
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return '';
  }
}
