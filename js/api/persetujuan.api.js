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
