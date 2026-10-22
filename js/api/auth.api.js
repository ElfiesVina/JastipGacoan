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

/** Daftar akun baru. @returns {Promise<{data,error}>} */
export const signUp = (email, password) => sb.auth.signUp({ email, password });

/** Keluar dari akun. */
export const signOut = () => sb.auth.signOut();
