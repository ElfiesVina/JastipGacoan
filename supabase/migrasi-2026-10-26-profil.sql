-- Profil jastip lengkap (foto, title, kampus, kutipan, sosmed, e-wallet, bank, status online).
-- Aman dijalankan berulang: hanya MENAMBAH kolom baru yang boleh kosong. Kolom lama (nama, rek, wa)
-- tidak diubah, tidak ada data yang dihapus, kebijakan RLS lama (p1) tetap berlaku.
-- Jalankan sekali di Supabase: SQL Editor -> New query -> tempel -> Run.

alter table profiles
  add column if not exists foto     text,                                   -- foto profil kecil (data URL JPEG, +-20 KB)
  add column if not exists title    text not null default 'jastip',         -- developer | cojastip | jastip
  add column if not exists kampus   text,
  add column if not exists jurusan  text,
  add column if not exists semester int,
  add column if not exists kutipan  text,
  add column if not exists sosmed   jsonb not null default '[]',           -- [{app, tampil:'akun'|'aplikasi', akun}]
  add column if not exists ewallet  text,                                   -- NAMA saja (mis. DANA), bukan nomor
  add column if not exists bank     text,                                   -- NAMA saja (mis. BCA), bukan nomor rekening
  add column if not exists online   boolean not null default false;

alter table profiles drop constraint if exists profiles_title_check;
alter table profiles add constraint profiles_title_check check (title in ('developer','cojastip','jastip'));
alter table profiles drop constraint if exists profiles_semester_check;
alter table profiles add constraint profiles_semester_check check (semester is null or semester between 1 and 14);
