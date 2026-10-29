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
  URL: 'https://bmhjbutnunmymrcldhmo.supabase.co',

  /** Anon (public) key Supabase. */
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGpidXRudW5teW1yY2xkaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2Njk0MDgsImV4cCI6MjEwODI0NTQwOH0.jw2cdtuxN6eM9IIyQ9RsM_vJsrf9Rq5TAEpLYGmTj9s',

  /** Daftar menu yang bisa dipilih penitip. Menu yang mengandung kata "mie" otomatis punya level pedas. */
  MENU: ['Mie Gacoan', 'Udang Keju', 'Thai Tea Iced'],

  /**
   * Email akun developer (pemilik aplikasi). Title "Developer" terpasang OTOMATIS untuk akun ini
   * (bukan dipilih sendiri), dan hanya akun ini yang boleh menyerahkan/mencabut title "Co Jastip"
   * ke akun lain. Dicek juga di database (fungsi is_developer()) supaya tidak bisa dilewati dari luar.
   */
  DEV_EMAIL: 'vifie14@gmail.com',

  /**
   * Verifikasi email dengan kode 6 digit setelah pendaftaran disetujui.
   * false = layar "Verified" lama (tombol kembali ke masuk). Ubah ke true HANYA setelah Edge Function
   * `kode-pendaftaran` terpasang (lihat docs/DESAIN-ALUR-PENDAFTARAN.md), kalau tidak pendaftar tidak bisa verifikasi.
   */
  OTP_PENDAFTARAN: false,

  /** Umur kode verifikasi (menit) dan jeda minimal kirim ulang (detik). Samakan dengan Edge Function. */
  OTP_MENIT: 5,
  OTP_JEDA_DETIK: 60,
};
