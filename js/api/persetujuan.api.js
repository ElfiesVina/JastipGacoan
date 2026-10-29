/**
 * js/api/persetujuan.api.js
 * Persetujuan pendaftaran jastip. Semua lewat fungsi database (RPC); tabelnya tertutup untuk akses langsung.
 * Lihat supabase/migrasi-2026-10-27-persetujuan.sql.
 */
import { sb } from './client.js';

/** Status pendaftaran satu email: 'menunggu' | 'disetujui' | 'ditolak' | null. Boleh dipanggil sebelum login. @param {string} email */
export const statusPendaftaran = (email) => sb.rpc('status_pendaftaran', { p_email: email });

/** [Developer/Co Jastip] Daftar pendaftar yang masih menunggu. Selain itu = daftar kosong. */
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
