/**
 * js/components/profile-icons.js
 * Ikon SVG kecil untuk kartu profil & beranda (ikut warna teks lewat currentColor).
 */
const icon = (body, size = 18, stroke = 1.9) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';

export const PROFILE_ICON = {
  pencil: icon('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  logout: icon('<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M16 8l4 4-4 4M20 12H9"/>'),
  chevron: icon('<path d="M9 5l7 7-7 7"/>', 18, 2.4),
  chevronDown: icon('<path d="M5 9l7 7 7-7"/>', 18, 2.4),
  school: icon('<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"/>'),
  book: icon('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'),
  semester: icon('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  whatsapp: icon('<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2-1.8-1-.8.6c-.8-.4-1.6-1.2-2-2l.6-.8-1-1.8z"/>', 18, 1.7),
  instagram: icon('<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".8" fill="currentColor"/>'),
  app: icon('<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M10 18h4"/>'),
  ewallet: icon('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1" fill="currentColor"/>'),
  bank: icon('<path d="M3 10l9-6 9 6z"/><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20h18"/>'),
  user: icon('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>', 22, 2),
  calendarPlus: icon('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M12 11v6M9 14h6"/>', 22, 2),
  profileDoc: icon('<path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', 40, 1.6),
  camera: icon('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 18, 1.9),
  clock: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 16, 2),
  moon: icon('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>', 22, 2),
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>', 22, 2),
};

/** Ikon baris kontak berdasarkan kunci (whatsapp, instagram, ewallet, bank, lainnya = app). */
export const contactIcon = (key) => PROFILE_ICON[key] || PROFILE_ICON.app;

/** Foto bawaan (siluet) bila admin belum mengunggah foto. */
export const DEFAULT_AVATAR_SVG =
  '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="currentColor" opacity=".16"/>' +
  '<circle cx="32" cy="25" r="11" fill="currentColor" opacity=".55"/>' +
  '<path d="M10 56c2-12 11-18 22-18s20 6 22 18z" fill="currentColor" opacity=".55"/></svg>';
