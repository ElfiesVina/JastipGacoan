/**
 * js/services/recap-image.js
 * Membuat gambar PNG rekap (kanvas) lalu mengunduhnya.
 */
import { state } from '../core/state.js';
import { label, rp } from '../core/format.js';
import { hitungRekap, pajak } from './calc.js';

const FONT_HEAD = "'Barlow Condensed',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',sans-serif";

/** Pastikan font web sudah dimuat sebelum menggambar (kalau tidak, teks pakai font cadangan). */
async function loadFonts() {
  try {
    await Promise.all(
      ['800 40px "Barlow Condensed"', '600 20px "Plus Jakarta Sans"', '800 20px "Plus Jakarta Sans"'].map((f) => document.fonts.load(f)),
    );
  } catch { /* abaikan, pakai font cadangan */ }
}

/**
 * Gambar seluruh rekap ke sebuah <canvas>.
 * Tinggi kanvas dihitung dari isi sehingga tidak ada bagian yang terpotong.
 * @returns {HTMLCanvasElement}
 */
function drawRecapCanvas() {
  const c = hitungRekap();
  const sesi = state.sesi;
  const W = 900;
  const barisRingkas = c.fee ? 4 : 3;
  const H = 290 + c.grup.length * 76 + 10 + barisRingkas * 40 + 210;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');

  // latar putih + pita teal di atas
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#07758f'; x.fillRect(0, 0, W, 210);

  // judul + info sesi
  x.fillStyle = '#fff'; x.font = '800 96px ' + FONT_HEAD; x.fillText('TITIP GACOAN', 48, 110);
  x.font = '600 22px ' + FONT_BODY;
  x.fillText((sesi.tgl || '') + ' · ' + c.grup.length + ' orang · ' + (sesi.nama || ''), 48, 160, W - 96);

  // satu blok per orang
  let y = 290;
  c.grup.forEach((g, i) => {
    x.fillStyle = '#10192b'; x.font = '800 28px ' + FONT_BODY; x.textAlign = 'left';
    x.fillText(String(i + 1).padStart(2, '0') + '  ' + g.nama, 48, y, 560);
    x.textAlign = 'right'; x.fillText(rp(g.sum), W - 48, y);
    x.textAlign = 'left'; x.fillStyle = '#5d6a80'; x.font = '400 20px ' + FONT_BODY;
    x.fillText(g.os.map(label).join(' + '), 96, y + 30, W - 144);
    y += 76;
  });

  // ringkasan biaya
  y += 10;
  const ringkas = [['Subtotal sebelum pajak', c.sub], ['PB1 · ' + pajak() + '%', c.pb1]]
    .concat(c.fee ? [['Fee jastip', c.fee]] : [], [['Pembulatan', c.rnd]]);
  ringkas.forEach((r) => {
    x.fillStyle = '#5d6a80'; x.font = '400 22px ' + FONT_BODY;
    x.textAlign = 'left'; x.fillText(r[0], 48, y);
    x.textAlign = 'right'; x.fillText(rp(r[1]), W - 48, y);
    y += 40;
  });

  // total + info transfer
  x.textAlign = 'left'; x.fillStyle = '#5d6a80'; x.font = '800 20px ' + FONT_HEAD; x.fillText('TOTAL DIBAYAR', 48, y + 30);
  x.fillStyle = '#e6007e'; x.font = '800 96px ' + FONT_HEAD; x.fillText(rp(c.tot), 48, y + 110);
  x.fillStyle = '#10192b'; x.font = '600 22px ' + FONT_BODY; x.fillText('Transfer: ' + (sesi.rek || ''), 48, y + 160, W - 96);
  return cv;
}

/** Buat gambar rekap lalu picu unduhan "rekap-titipan.png". */
export async function saveRecapImage() {
  await loadFonts();
  const cv = drawRecapCanvas();
  cv.toBlob((b) => {
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = 'rekap-titipan.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  });
}
