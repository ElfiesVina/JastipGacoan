/**
 * js/api/auth.api.js
 * Autentikasi admin/jastip (email + password).
 */
import { sb } from './client.js';

import { CFG } from '../config.js';

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


const EDGE_URL = `${CFG.URL}/functions/v1/kode-pendaftaran`;

/** Minta Edge Function mengirim kode 6 digit ke email (dipanggil saat klik "Masuk" di halaman pending). */
export async function kirimKodePendaftaran(email) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CFG.KEY },
    body: JSON.stringify({ action: 'kirim', email }),
  });
  return res.json(); // { ok: true } atau { error: '...' }
}

/** Verifikasi kode 6 digit. Kalau benar, pasang session-nya supaya user benar-benar login. */
export async function verifikasiKodePendaftaran(email, token) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CFG.KEY },
    body: JSON.stringify({ action: 'verifikasi', email, token }),
  });
  const result = await res.json();

  if (result.ok && result.session) {
    // Pasang session dari Edge Function supaya browser benar-benar dianggap login
    await sb.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
  }
  return result; // { ok: true, session } atau { error: '...' }
}
