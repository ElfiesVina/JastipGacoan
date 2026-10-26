/**
 * js/services/profile-rules.js
 * Aturan profil jastip (tanpa DOM, tanpa jaringan): kelengkapan, pembersihan isian,
 * dan teks yang aman ditampilkan di profil publik.
 */
import { normalizePhone } from '../core/format.js';
import { CFG } from '../config.js';
import {
  SOCIAL_APPS, SOCIAL_SLOTS, EWALLET_OPTIONS, BANK_OPTIONS, MAX_QUOTE_LENGTH, MAX_SEMESTER,
} from '../data/profile-options.js';

const text = (value) => String(value ?? '').trim();

/**
 * Title TIDAK PERNAH dipilih sendiri lewat form — selalu dihitung dari data lain:
 *  - "Developer": otomatis untuk SATU akun (CFG.DEV_EMAIL), dicocokkan dari email akun yang login.
 *    Dicek ulang di database (fungsi is_developer()) supaya tidak bisa dipalsukan dari klien.
 *  - "Co Jastip": dari kolom profiles.cojastip (boolean). Hanya developer yang boleh mengubahnya
 *    (lewat RPC set_cojastip, ditolak di database kalau bukan developer). Developer SELALU
 *    otomatis punya title ini juga secara tampilan (default "co" ada di developer).
 *  - Selain itu: "Jastip".
 */

/** true bila email yang diberikan adalah akun developer. */
export const isDeveloperEmail = (email) => text(email).toLowerCase() === CFG.DEV_EMAIL.toLowerCase();

/**
 * Title yang tampil di kartu profil (bisa lebih dari satu, mis. akun developer = "Developer" + "Co Jastip").
 * @param {object|null} profile baris profil dari database @param {string} [email] email akun yang login
 * @returns {string[]}
 */
export function roleLabels(profile, email) {
  const dev = isDeveloperEmail(email);
  const labels = [];
  if (dev) labels.push('Developer');
  if (dev || profile?.cojastip) labels.push('Co Jastip');
  if (!labels.length) labels.push('Jastip');
  return labels;
}

/** Label aplikasi media sosial dari nilainya. */
export const socialLabel = (value) => SOCIAL_APPS.find((a) => a.value === value)?.label || '';

/**
 * Profil dianggap lengkap bila data yang TERSIMPAN di database memuat semua isian wajib.
 * @param {object|null} profile baris profil dari database
 */
export function isProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(
    text(profile.nama) && text(profile.wa) && text(profile.rek) &&
    text(profile.kampus) && text(profile.jurusan) && Number(profile.semester) > 0,
  );
}

/**
 * Baris media sosial untuk tampilan publik. WhatsApp hanya menampilkan nama aplikasinya
 * (nomor tidak pernah tampil). Aplikasi lain: nama aplikasi atau @akun sesuai pilihan admin.
 * @returns {{icon:string,name:string,value:string}[]}
 */
export function publicContactRows(profile) {
  const rows = [];
  if (text(profile.wa)) rows.push({ icon: 'whatsapp', name: 'WhatsApp', value: 'Aplikasi' });
  for (const item of Array.isArray(profile.sosmed) ? profile.sosmed : []) {
    const name = socialLabel(item.app);
    if (!name) continue;
    const showAccount = item.tampil === 'akun' && text(item.akun);
    rows.push({ icon: item.app, name, value: showAccount ? '@' + text(item.akun) : 'Aplikasi' });
  }
  if (text(profile.ewallet)) rows.push({ icon: 'ewallet', name: 'E-Wallet', value: text(profile.ewallet) });
  if (text(profile.bank)) rows.push({ icon: 'bank', name: 'Bank', value: text(profile.bank) });
  return rows;
}

/**
 * Ubah isian form mentah jadi baris siap simpan (sudah dibersihkan & dibatasi).
 * @param {Record<string,string>} raw nilai form
 */
export function buildProfilePatch(raw) {
  const semester = Number(raw.semester);
  const sosmed = [];
  for (let i = 0; i < SOCIAL_SLOTS; i++) {
    const app = raw['social_app_' + i];
    if (!socialLabel(app) || sosmed.some((s) => s.app === app)) continue;
    sosmed.push({
      app,
      tampil: raw['social_show_' + i] === 'akun' ? 'akun' : 'aplikasi',
      akun: text(raw['social_user_' + i]).replace(/^@/, '').slice(0, 40),
    });
  }
  return {
    // title & online TIDAK diisi lewat form ini: title dihitung (lihat roleLabels), online
    // dikelola otomatis oleh services/presence.js mengikuti status masuk/keluar akun.
    nama: text(raw.nama).slice(0, 60),
    kampus: text(raw.kampus).slice(0, 80),
    jurusan: text(raw.jurusan).slice(0, 80),
    semester: semester >= 1 && semester <= MAX_SEMESTER ? semester : null,
    kutipan: text(raw.kutipan).slice(0, MAX_QUOTE_LENGTH),
    wa: raw.wa ? normalizePhone(raw.wa) : '',
    rek: text(raw.rek).slice(0, 120),
    sosmed,
    ewallet: EWALLET_OPTIONS.includes(raw.ewallet) ? raw.ewallet : null,
    bank: BANK_OPTIONS.includes(raw.bank) ? raw.bank : null,
  };
}

/** Pesan galat untuk isian yang tidak valid, atau '' bila aman disimpan. */
export function validateProfilePatch(patch) {
  if (!patch.nama) return 'Nama jastip wajib diisi.';
  if (patch.wa && !/^62\d{8,13}$/.test(patch.wa)) return 'Nomor WA tidak valid. Contoh: 0812xxxxxxx.';
  return '';
}
