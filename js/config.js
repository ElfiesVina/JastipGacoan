/**
 * js/config.js
 * Pengaturan aplikasi. Satu-satunya tempat yang perlu kamu ubah jika
 * pindah proyek Supabase atau mengganti daftar menu.
 *
 * PENTING: anon key memang publik (aman). Keamanan data dijaga oleh RLS di database.
 * JANGAN PERNAH menaruh `service_role` key di file ini.
 */
export const CFG = {
  /** Alamat proyek Supabase. */
  URL: 'https://fmzwtbclzhjppibtyilq.supabase.co/',

  /** Anon (public) key Supabase. */
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtend0YmNsemhqcHBpYnR5aWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODcwMzYsImV4cCI6MjEwNzU2MzAzNn0.PT4pMuCJRL7pijqk80HGZcKSf68RJfPPD-J2Voh1Pto',

  /** Daftar menu yang bisa dipilih penitip. Menu yang mengandung kata "mie" otomatis punya level pedas. */
  MENU: ['Mie Gacoan', 'Udang Keju', 'Thai Tea Iced'],
};
