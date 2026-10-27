/**
 * js/data/profile-options.js
 * Pilihan tetap untuk form profil jastip. Hanya NAMA layanan yang disimpan,
 * tidak pernah nomor rekening / nomor e-wallet.
 */

/** Aplikasi media sosial selain WhatsApp (WhatsApp memakai kolom `wa`). */
export const SOCIAL_APPS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'youtube', label: 'YouTube' },
];

/** Cara menampilkan media sosial di profil. */
export const SOCIAL_DISPLAY = [
  { value: 'aplikasi', label: 'Nama app' },
  { value: 'akun', label: '@akun' },
];

export const EWALLET_OPTIONS = ['DANA', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja'];
export const BANK_OPTIONS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Permata', 'SeaBank', 'Jago'];

/** Jumlah baris media sosial di form. */
export const SOCIAL_SLOTS = 3;
export const MAX_QUOTE_LENGTH = 160;
export const MAX_SEMESTER = 14;
