/**
 * js/api/persetujuan.api.js
 * Persetujuan pendaftaran jastip. Semua lewat fungsi database (RPC); tabelnya tertutup untuk akses langsung.
 * Fungsinya ada di supabase/schema.sql (bagian 5).
 */
import { sb } from './client.js';

/** Status pendaftaran satu email: 'menunggu' | 'diperiksa' | 'disetujui' | 'ditolak' | null. Boleh dipanggil sebelum login. @param {string} email */
export const statusPendaftaran = (email) => sb.rpc('status_pendaftaran', { p_email: email });

/** [Developer/Co Jastip] Daftar pendaftar yang masih berjalan (menunggu + diperiksa). Selain itu = daftar kosong. */
export const listPermintaan = () => sb.rpc('list_permintaan_jastip');

/** [Developer/Co Jastip] Setujui atau tolak satu pendaftar. @param {string} id @param {boolean} setuju */
export const putuskanPermintaan = (id, setuju) => sb.rpc('putuskan_permintaan_jastip', { target: id, setuju });

/** [Developer/Co Jastip] Mulai memeriksa satu pendaftar: menunggu -> diperiksa. @param {string} id */
export const mulaiPeriksa = (id) => sb.rpc('mulai_periksa_permintaan_jastip', { target: id });

/** [Developer/Co Jastip] Jumlah pendaftar per status: {menunggu, diperiksa, disetujui}. Selain itu = objek kosong. */
export const hitungPermintaan = () => sb.rpc('hitung_permintaan_jastip');

/**
 * Minta kode verifikasi email baru untuk pendaftar yang sudah disetujui.
 * Lewat Edge Function `kode-pendaftaran` (server tepercaya); kode TIDAK pernah lewat tabel publik.
 * CATATAN: Edge Function ini BELUM ada di repo. Biarkan CFG.OTP_PENDAFTARAN = false sampai dipasang.
 * @param {string} email
 */
export const kirimKodePendaftaran = (email) =>
  sb.functions.invoke('kode-pendaftaran', { body: { aksi: 'kirim', email } });

/**
 * Cek kode 6 digit dari email. Benar = server menandai email terverifikasi.
 * @param {string} email @param {string} kode
 */
export const verifikasiKodePendaftaran = (email, kode) =>
  sb.functions.invoke('kode-pendaftaran', { body: { aksi: 'verifikasi', email, kode } });
