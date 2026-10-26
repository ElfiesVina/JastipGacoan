-- Title Developer/Co Jastip otomatis + status online realtime, 26 Okt 2026.
-- Jalankan SEKALI di Supabase > SQL Editor, SETELAH migrasi-2026-10-26-profil.sql. Aman diulang.
--
-- Ringkasan perubahan:
--  - Title TIDAK LAGI dipilih sendiri lewat form. "Developer" otomatis untuk SATU akun (emailnya
--    dicek di bawah), "Co Jastip" dari kolom `cojastip` (boolean) yang HANYA boleh diubah oleh
--    akun developer (dicek di server, bukan cuma disembunyikan di tampilan).
--  - Kolom `title` lama DIBIARKAN APA ADANYA (tidak dihapus, tidak dipakai lagi oleh aplikasi).
--  - Status online/offline sekarang mengikuti sesi login (lihat js/services/presence.js), supaya
--    itu bisa langsung terlihat tanpa reload, tabel profiles diikutkan ke publikasi Realtime.

alter table profiles
  add column if not exists cojastip boolean not null default false;

-- Ganti 'vifie14@gmail.com' di SEMUA tempat pada file ini kalau email developer pernah berubah.

-- true bila akun yang SEDANG LOGIN adalah developer. security definer supaya boleh membaca
-- auth.users (RLS tabel itu tidak mengizinkan pengguna biasa membacanya).
create or replace function is_developer() returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select lower(email) from auth.users where id = auth.uid()) = 'vifie14@gmail.com', false)
$$;
grant execute on function is_developer() to authenticated;

-- Daftar akun jastip untuk panel "Kelola Co Jastip" di dashboard developer.
-- Mengembalikan daftar KOSONG kalau pemanggilnya bukan developer (bukan galat, supaya aman dipanggil klien mana pun).
create or replace function list_jastip_profiles() returns json language sql stable security definer set search_path=public as $$
  select case when is_developer() then
    coalesce(
      (select json_agg(json_build_object(
         'id', p.id, 'email', u.email, 'nama', p.nama, 'cojastip', p.cojastip, 'online', p.online
       ) order by p.nama nulls last)
       from profiles p join auth.users u on u.id = p.id),
      '[]'::json
    )
  else '[]'::json end
$$;
grant execute on function list_jastip_profiles() to authenticated;

-- Menyerahkan ('value' true) atau mencabut ('value' false) title Co Jastip dari satu akun.
-- Menolak (raise exception) kalau pemanggilnya BUKAN developer -- dicek di sini, bukan di klien,
-- jadi tidak bisa dilewati walau seseorang memanggil RPC ini langsung dari luar aplikasi.
create or replace function set_cojastip(target uuid, value boolean) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_developer() then
    raise exception 'Hanya developer yang boleh mengatur title Co Jastip';
  end if;
  update profiles set cojastip = value where id = target;
end $$;
grant execute on function set_cojastip(uuid, boolean) to authenticated;

-- Realtime: supaya status online/offline & title Co Jastip di panel developer ikut berubah
-- langsung tanpa reload begitu jastip lain masuk/keluar atau title-nya diubah.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
