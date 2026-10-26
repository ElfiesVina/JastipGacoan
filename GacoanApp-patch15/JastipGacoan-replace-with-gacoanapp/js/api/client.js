/**
 * js/api/client.js
 * Membuat SATU koneksi Supabase untuk seluruh aplikasi.
 * Library `supabase` dimuat lewat <script> di index.html (variabel global).
 *
 * ---------------------------------------------------------------
 * CATATAN UNTUK MENGULANG BACKEND:
 * Semua pemanggilan ke backend HANYA ada di folder js/api/.
 * Folder lain (views, services, components) tidak tahu apa-apa soal Supabase.
 * Jadi kalau backend diganti, cukup tulis ulang isi js/api/ dengan
 * KONTRAK YANG SAMA (lihat docs/ARSITEKTUR.md): setiap fungsi
 * mengembalikan { data, error }.
 * ---------------------------------------------------------------
 */
import { CFG } from '../config.js';

/**
 * Info dari link email (reset password). Harus dibaca SEBELUM createClient,
 * karena Supabase menghapus token dari URL setelah membacanya.
 */
export const OPENED_FROM_RECOVERY_LINK = /type=recovery/.test(location.hash);   // link reset valid
export const RESET_LINK_EXPIRED = /error_code=otp_expired/.test(location.hash); // link sudah kedaluwarsa/terpakai

export const sb = window.supabase.createClient(CFG.URL, CFG.KEY);
