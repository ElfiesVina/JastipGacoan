/**
 * js/views/admin-profile.js
 * Logika profil jastip: buka/tutup form, simpan ke database (tampilan baru dibuat dari data
 * yang benar-benar tersimpan), status online, dan foto profil.
 */
import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast, lock } from '../core/ui.js';
import { updateProfile } from '../api/profile.api.js';
import { portraitAvatar } from '../services/image.js';
import { buildProfilePatch, validateProfilePatch } from '../services/profile-rules.js';
import { showDashboard } from './admin-dashboard.js';

/** true selama form edit tampil. */
let isEditing = false;
/** Foto baru yang dipilih tapi belum disimpan: data URL, '' = hapus, undefined = tidak diubah. */
let pendingPhoto;

export const isEditingProfile = () => isEditing;

/** Tampilkan form (tombol Edit / Lengkapi Profile). */
export function openProfileForm() {
  isEditing = true;
  pendingPhoto = undefined;
  showDashboard(state.rid);
  $('#profile-form')?.scrollIntoView({ block: 'start' });
}

/** Tutup form tanpa menyimpan. */
export function closeProfileForm() {
  isEditing = false;
  pendingPhoto = undefined;
  showDashboard(state.rid);
}

/** Terjemahkan galat database ke pesan yang bisa ditindaklanjuti. */
function describeSaveError(error) {
  if (/column|schema cache/i.test(error.message || '')) {
    return 'Kolom profil belum ada di database. Jalankan file migrasi-2026-10-26-profil.sql di Supabase.';
  }
  return error.message || 'Gagal menyimpan profil.';
}

/** Ubah satu kolom lalu muat ulang beranda dari data tersimpan. */
async function persist(patch, successMessage) {
  const { data, error } = await updateProfile(state.user.id, patch);
  if (error || !data) {
    toast(describeSaveError(error || {}), 1);
    return false;
  }
  state.profil = data; // satu-satunya sumber: baris yang dikembalikan database
  if (successMessage) toast(successMessage);
  return true;
}

/** Simpan isi form. Tampilan baru berganti hanya bila penyimpanan berhasil. */
export function saveProfileForm() {
  return lock(async () => {
    const form = $('#profile-form');
    if (!form) return;
    const raw = Object.fromEntries(new FormData(form));
    const patch = buildProfilePatch(raw);
    const problem = validateProfilePatch(patch);
    if (problem) { toast(problem, 1); return; }
    if (pendingPhoto !== undefined) patch.foto = pendingPhoto || null;
    if (!(await persist(patch, 'Profil tersimpan ✓'))) return;
    isEditing = false;
    pendingPhoto = undefined;
    await showDashboard(state.rid);
  });
}

/** Foto dipilih: potong jadi potret 3:4, tampilkan pratinjau (disimpan saat menekan Simpan). */
export async function previewPhoto(input) {
  const file = input.files?.[0];
  if (!file) return;
  const dataUrl = await portraitAvatar(file);
  if (!dataUrl) { toast('Foto tidak bisa dibaca. Coba foto lain.', 1); return; }
  pendingPhoto = dataUrl;
  $('#photo-preview').innerHTML = '<img src="' + dataUrl + '" alt="Pratinjau foto profil">';
}
