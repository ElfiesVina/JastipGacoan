/**
 * js/services/otp-clock.js
 * Jam hitung mundur kode verifikasi + jeda kirim ulang. Hanya waktu; tidak bicara ke backend.
 * Batas waktu disimpan di sessionStorage per email supaya muat ulang halaman tidak mengulang 05:00.
 * (Sumber kebenaran tetap server: kode yang lewat waktu pasti ditolak di sana.)
 */
import { CFG } from '../config.js';

const KEY = 'otp_end:';
let id = 0;

/** Format detik jadi mm:ss. @param {number} s */
export const mmss = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

/** Batas waktu (ms epoch) tersimpan untuk email ini, atau 0. @param {string} email */
export function savedEnd(email) {
  try { return +sessionStorage.getItem(KEY + email) || 0; } catch (_) { return 0; }
}

/** Mulai hitungan baru: batas = sekarang + umur kode. @param {string} email @returns {number} batas waktu (ms epoch) */
export function newEnd(email) {
  const end = Date.now() + CFG.OTP_MENIT * 60000;
  try { sessionStorage.setItem(KEY + email, String(end)); } catch (_) { /* abaikan */ }
  return end;
}

/**
 * Jalankan jam: panggil onTick tiap detik dengan sisa waktu kode dan sisa jeda kirim ulang.
 * @param {{end:number, cooldownEnd:number, onTick:(left:number, cool:number)=>void}} o
 *   end = batas kode (ms epoch), cooldownEnd = kirim ulang boleh lagi setelah ini (ms epoch)
 * @returns {() => void} fungsi untuk menghentikan jam
 */
export function startClock(o) {
  stopClock();
  const tick = () => {
    const now = Date.now();
    o.onTick(Math.max(0, Math.ceil((o.end - now) / 1000)), Math.max(0, Math.ceil((o.cooldownEnd - now) / 1000)));
  };
  tick();
  id = setInterval(tick, 1000);
  return stopClock;
}

/** Hentikan jam yang sedang berjalan. */
export function stopClock() { clearInterval(id); id = 0; }
