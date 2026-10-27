/**
 * js/api/persetujuan.api.js
 * Pengajuan jadi admin jastip. Semua lewat fungsi database (RPC); tabelnya tertutup untuk akses langsung.
 * Lihat supabase/migrasi-2026-10-27-persetujuan.sql.
 */
import { sb } from './client.js';

/** Siapa saja (belum login) boleh mengajukan. @param {{email:string,nama:string,pesan?:string}} row */
export const ajukanJastip = ({ email, nama, pesan }) =>
  sb.rpc('ajukan_jastip', { p_email: email, p_nama: nama, p_pesan: pesan || '' });

/** [Developer saja] Daftar pengajuan yang masih menunggu. Bukan developer = daftar kosong. */
export const listPermintaan = () => sb.rpc('list_permintaan_jastip');

/** [Developer saja] Setujui (email masuk daftar izin) atau tolak satu pengajuan. @param {string} id @param {boolean} setuju */
export const putuskanPermintaan = (id, setuju) => sb.rpc('putuskan_permintaan_jastip', { target: id, setuju });
