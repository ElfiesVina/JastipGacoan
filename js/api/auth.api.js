/**
 * js/api/auth.api.js
 * Autentikasi admin/jastip (email + password).
 */
import { sb } from './client.js';

/** Ambil sesi login saat ini. @returns {Promise<object|null>} session atau null */
export async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

/** Masuk dengan email & password. @returns {Promise<{data,error}>} */
export const signIn = (email, password) => sb.auth.signInWithPassword({ email, password });

/**
 * Daftar akun baru. Nama dan alasan mendaftar disimpan sebagai metadata akun (user_metadata.nama / .alasan);
 * trigger di database mencatatnya sebagai pendaftaran berstatus 'menunggu'.
 * @returns {Promise<{data,error}>}
 */
export const signUp = (email, password, nama, alasan) =>
  sb.auth.signUp({ email, password, options: { data: { nama, alasan } } });

/** Keluar dari akun. */
export const signOut = () => sb.auth.signOut();

/**
 * Kirim email berisi link untuk membuat password baru.
 * @param {string} email @param {string} redirectTo alamat tujuan setelah link diketuk
 *   (harus terdaftar di Supabase > Authentication > URL Configuration > Redirect URLs)
 */
export const sendResetEmail = (email, redirectTo) => sb.auth.resetPasswordForEmail(email, { redirectTo });

/**
 * Cek kode (OTP) yang dikirim ke email untuk reset password. Kalau benar, Supabase membuat sesi
 * sehingga password baru bisa disimpan lewat updatePassword().
 * Butuh template email "Reset Password" di Supabase berisi {{ .Token }}.
 * @param {string} email @param {string} token kode angka dari email
 */
export const verifyResetCode = (email, token) => sb.auth.verifyOtp({ email, token, type: 'recovery' });

/** Ganti password akun yang sedang login (dipakai setelah membuka link reset). */
export const updatePassword = (password) => sb.auth.updateUser({ password });
