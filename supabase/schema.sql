-- =====================================================================
-- Titip Gacoan: schema.sql (gabungan, kondisi akhir per 29 Okt 2026)
-- Menggantikan (sudah digabung, file lama tidak diperlukan): schema, batasi-jastip, migrasi-2026-10-15, -10-26-profil,
-- -10-26-title-cojastip, -10-27-persetujuan, -10-29-status-diperiksa
-- (+ -co-dev-jastip), -10-29-hitung-persetujuan.
--
-- CARA PAKAI: Supabase > SQL Editor > New query > tempel SEMUA > Run.
-- Email developer ada di 2 tempat: is_developer() dan seed allowed_jastip
-- (bagian 8). Ganti keduanya bila emailnya berubah.
-- =====================================================================


-- =====================================================================
-- 0. RESET  (NONAKTIF secara default, dibungkus komentar blok)
--    Bagian ini MENGHAPUS data tabel aplikasi: sesi, pesanan, profil,
--    pendaftaran. Akun login di auth.users TIDAK dihapus.
--    Proyek Supabase kosong  : biarkan seperti ini, langsung Run.
--    Ingin mengulang dari nol: hapus tanda "/*" di bawah dan "*/" di akhir
--    bagian ini, lalu Run. Pasang kembali tandanya setelah selesai.
-- =====================================================================
/*
drop trigger if exists t_buat_permintaan_jastip on auth.users;
drop trigger if exists t_cek_jastip on auth.users;
drop policy  if exists b1 on storage.objects;

drop table if exists pesanan, sesi, permintaan_jastip, allowed_jastip, profiles cascade;

drop function if exists get_sesi(text);
drop function if exists list_pesanan(text);
drop function if exists tambah_pesanan(text, text, text, text);
drop function if exists tandai_bayar(text, text, text);
drop function if exists kode_settled(text);
drop function if exists status_pendaftaran(text);
drop function if exists list_jastip_profiles();
drop function if exists set_cojastip(uuid, boolean);
drop function if exists list_permintaan_jastip();
drop function if exists mulai_periksa_permintaan_jastip(uuid);
drop function if exists putuskan_permintaan_jastip(uuid, boolean);
drop function if exists hitung_permintaan_jastip();
drop function if exists is_developer();
drop function if exists is_cojastip();
drop function if exists is_approver();
drop function if exists is_approved();
drop function if exists jaga_cojastip();
drop function if exists buat_permintaan_jastip();
drop function if exists cek_jastip();
drop function if exists ajukan_jastip(text, text, text);
*/


-- =====================================================================
-- 1. TABEL
-- =====================================================================
create table profiles (
  id        uuid primary key references auth.users on delete cascade,
  nama      text,
  rek       text,
  wa        text,
  foto      text,                                   -- foto kecil (data URL JPEG, +-20 KB)
  kampus    text,
  jurusan   text,
  semester  int  check (semester is null or semester between 1 and 14),
  kutipan   text,
  sosmed    jsonb   not null default '[]',          -- [{app, tampil:'akun'|'aplikasi', akun}]
  ewallet   text,                                   -- NAMA saja (mis. DANA), bukan nomor
  bank      text,                                   -- NAMA saja (mis. BCA), bukan nomor rekening
  online    boolean not null default false,
  cojastip  boolean not null default false          -- hanya developer yang boleh mengubah (lihat trigger)
);

create table sesi (
  id         uuid primary key default gen_random_uuid(),
  kode       text unique not null,
  owner      uuid not null references auth.users on delete cascade,
  judul      text,
  waktu      text,
  status     text    not null default 'open' check (status in ('open', 'closed', 'settled')),
  pajak      numeric not null default 10 check (pajak >= 0 and pajak <= 100),
  fee        int     not null default 0 check (fee >= 0 and fee <= 1000000),
  tgl        date    not null default current_date,
  prices     jsonb   not null default '{}',
  created_at timestamptz default now()
);
create index sesi_owner_idx on sesi(owner);

create table pesanan (
  id         uuid primary key default gen_random_uuid(),
  sesi_id    uuid not null references sesi on delete cascade,
  nama       text not null,
  item       text not null,
  level      text check (level is null or level ~ '^[1-8]?$'),
  paid       boolean not null default false,
  bukti      text,
  created_at timestamptz default now()
);
create index pesanan_sesi_idx on pesanan(sesi_id);

-- Email yang otomatis disetujui saat mendaftar. Tabel tertutup (tanpa kebijakan RLS).
create table allowed_jastip (email text primary key);

-- Pendaftaran jastip. Tabel tertutup: hanya lewat fungsi di bagian 5.
create table permintaan_jastip (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email   text not null,
  nama    text not null,
  alasan  text not null default '',
  status  text not null default 'menunggu',
  dibuat  timestamptz not null default now(),
  constraint permintaan_jastip_status_check
    check (status in ('menunggu', 'diperiksa', 'disetujui', 'ditolak'))
);
create unique index permintaan_jastip_user_uq  on permintaan_jastip (user_id);
create index        permintaan_jastip_email_idx on permintaan_jastip (lower(email));


-- =====================================================================
-- 2. FUNGSI PERAN  (dipakai kebijakan & fungsi lain, jadi dibuat lebih dulu)
-- =====================================================================
-- true bila akun yang SEDANG login adalah developer.
create or replace function is_developer() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select lower(email) from auth.users where id = auth.uid()) = 'vifie14@gmail.com', false)
$$;
grant execute on function is_developer() to authenticated;

create or replace function is_cojastip() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select cojastip from profiles where id = auth.uid()), false)
$$;
grant execute on function is_cojastip() to authenticated;

-- Yang boleh menyetujui pendaftaran: developer atau Co Jastip.
create or replace function is_approver() returns boolean
language sql stable security definer set search_path = public as $$
  select is_developer() or is_cojastip()
$$;
grant execute on function is_approver() to authenticated;

-- true bila akun sudah disetujui (developer selalu lolos).
create or replace function is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select is_developer()
      or exists (select 1 from permintaan_jastip where user_id = auth.uid() and status = 'disetujui')
$$;
grant execute on function is_approved() to authenticated;

-- true bila folder bukti (= kode sesi) milik sesi yang rekapnya sudah terbit.
create or replace function kode_settled(k text) returns boolean
language sql security definer set search_path = public as $$
  select exists(select 1 from sesi where kode = k and status = 'settled')
$$;


-- =====================================================================
-- 3. TRIGGER
-- =====================================================================
-- Hanya developer yang boleh mengubah kolom cojastip (hak menyetujui ikut di dalamnya).
create or replace function jaga_cojastip() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.cojastip and not is_developer() then new.cojastip := false; end if;
  elsif new.cojastip is distinct from old.cojastip and not is_developer() then
    new.cojastip := old.cojastip;
  end if;
  return new;
end $$;
create trigger t_jaga_cojastip before insert or update on profiles
  for each row execute function jaga_cojastip();

-- Tiap akun baru otomatis tercatat sebagai pendaftaran ('menunggu', atau
-- 'disetujui' bila emailnya ada di allowed_jastip).
create or replace function buat_permintaan_jastip() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nama   text := left(trim(coalesce(new.raw_user_meta_data->>'nama', '')), 60);
  v_alasan text := left(trim(coalesce(new.raw_user_meta_data->>'alasan', '')), 300);
  v_status text := case when exists (select 1 from allowed_jastip where lower(email) = lower(new.email))
                        then 'disetujui' else 'menunggu' end;
begin
  insert into permintaan_jastip (user_id, email, nama, alasan, status)
  values (new.id, lower(new.email), coalesce(nullif(v_nama, ''), split_part(new.email, '@', 1)), v_alasan, v_status)
  on conflict (user_id) do nothing;
  return new;
end $$;
create trigger t_buat_permintaan_jastip after insert on auth.users
  for each row execute function buat_permintaan_jastip();


-- =====================================================================
-- 4. RLS & KEBIJAKAN
-- =====================================================================
alter table profiles          enable row level security;
alter table sesi              enable row level security;
alter table pesanan           enable row level security;
alter table allowed_jastip    enable row level security;   -- tanpa kebijakan = tertutup
alter table permintaan_jastip enable row level security;   -- tanpa kebijakan = tertutup

create policy p1 on profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy s1 on sesi for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- "restrictive": akun yang belum disetujui TIDAK boleh membuat sesi.
create policy sesi_wajib_disetujui on sesi as restrictive for insert to authenticated
  with check (is_approved());

create policy o1 on pesanan for all to authenticated
  using      (exists (select 1 from sesi s where s.id = sesi_id and s.owner = auth.uid()))
  with check (exists (select 1 from sesi s where s.id = sesi_id and s.owner = auth.uid()));


-- =====================================================================
-- 5. FUNGSI RPC  (dipanggil dari js/api/*)
-- =====================================================================
-- ---- Publik (penitip, tanpa login) ----
create or replace function get_sesi(k text) returns json
language sql security definer set search_path = public as $$
  select json_build_object('id', s.id, 'judul', s.judul, 'status', s.status, 'pajak', s.pajak,
    'fee', s.fee, 'tgl', s.tgl, 'waktu', s.waktu, 'prices', s.prices,
    'nama', p.nama, 'rek', p.rek, 'wa', p.wa)
  from sesi s left join profiles p on p.id = s.owner where s.kode = k
$$;
grant execute on function get_sesi(text) to anon, authenticated;

create or replace function list_pesanan(k text) returns json
language sql security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', o.id, 'nama', o.nama, 'item', o.item,
    'level', o.level, 'paid', o.paid, 'bukti', o.bukti) order by o.created_at), '[]'::json)
  from pesanan o join sesi s on s.id = o.sesi_id where s.kode = k
$$;
grant execute on function list_pesanan(text) to anon, authenticated;

-- true = diterima; false = ditolak (sesi ditutup, nama/item kosong, atau penuh 300 baris).
create or replace function tambah_pesanan(k text, n text, i text, l text) returns boolean
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select id into sid from sesi where kode = k and status = 'open';
  if sid is null or length(trim(n)) = 0 or length(trim(i)) = 0 then return false; end if;
  if (select count(*) from pesanan where sesi_id = sid) >= 300 then return false; end if;
  insert into pesanan(sesi_id, nama, item, level)
  values (sid, left(trim(n), 60), left(trim(i), 60), case when l ~ '^[1-8]$' then l else '' end);
  return true;
end $$;
grant execute on function tambah_pesanan(text, text, text, text) to anon, authenticated;

-- Link bukti hanya diterima bila dari bucket 'bukti' proyek Supabase (cegah javascript:/situs lain).
create or replace function tandai_bayar(k text, n text, b text) returns void
language sql security definer set search_path = public as $$
  update pesanan set paid = true,
    bukti = coalesce(case when b ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/bukti/' then b end, bukti)
  where sesi_id = (select id from sesi where kode = k and status = 'settled')
    and lower(trim(nama)) = lower(trim(n))
$$;
grant execute on function tandai_bayar(text, text, text) to anon, authenticated;

-- Status pendaftaran untuk halaman Pending: menunggu | diperiksa | disetujui | ditolak (kosong bila tak dikenal).
create or replace function status_pendaftaran(p_email text) returns text
language sql stable security definer set search_path = public as $$
  select status from permintaan_jastip
  where lower(email) = lower(trim(coalesce(p_email, '')))
  order by dibuat desc limit 1
$$;
grant execute on function status_pendaftaran(text) to anon, authenticated;

-- ---- Developer ----
create or replace function list_jastip_profiles() returns json
language sql stable security definer set search_path = public as $$
  select case when is_developer() then
    coalesce((select json_agg(json_build_object('id', p.id, 'email', u.email, 'nama', p.nama,
      'cojastip', p.cojastip, 'online', p.online) order by p.nama nulls last)
      from profiles p join auth.users u on u.id = p.id), '[]'::json)
  else '[]'::json end
$$;
grant execute on function list_jastip_profiles() to authenticated;

create or replace function set_cojastip(target uuid, value boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_developer() then
    raise exception 'Hanya developer yang boleh mengatur title Co Jastip';
  end if;
  update profiles set cojastip = value where id = target;
end $$;
grant execute on function set_cojastip(uuid, boolean) to authenticated;

-- ---- Developer / Co Jastip (panel Persetujuan) ----
-- Pendaftar yang masih berjalan (menunggu + diperiksa). Kosong bila bukan developer/Co Jastip.
create or replace function list_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
  select case when is_approver() then
    coalesce((select json_agg(json_build_object(
        'id', r.id, 'email', r.email, 'nama', r.nama,
        'alasan', r.alasan, 'status', r.status, 'dibuat', r.dibuat)
      order by case r.status when 'menunggu' then 0 when 'diperiksa' then 1 else 2 end, r.dibuat)
      from permintaan_jastip r where r.status in ('menunggu', 'diperiksa')), '[]'::json)
  else '[]'::json end
$$;
grant execute on function list_permintaan_jastip() to authenticated;

-- Mulai memeriksa: menunggu -> diperiksa.
create or replace function mulai_periksa_permintaan_jastip(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_approver() then raise exception 'Hanya Developer atau Co Jastip yang boleh memeriksa'; end if;
  update permintaan_jastip set status = 'diperiksa' where id = target and status = 'menunggu';
  if not found then raise exception 'Pendaftaran tidak ditemukan atau sudah diproses'; end if;
end $$;
grant execute on function mulai_periksa_permintaan_jastip(uuid) to authenticated;

-- Setujui / tolak: boleh dari 'menunggu' maupun 'diperiksa'.
create or replace function putuskan_permintaan_jastip(target uuid, setuju boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_approver() then raise exception 'Hanya Developer atau Co Jastip yang boleh memutuskan'; end if;
  update permintaan_jastip set status = case when setuju then 'disetujui' else 'ditolak' end
    where id = target and status in ('menunggu', 'diperiksa');
  if not found then raise exception 'Pendaftaran tidak ditemukan atau sudah diproses'; end if;
end $$;
grant execute on function putuskan_permintaan_jastip(uuid, boolean) to authenticated;

-- Jumlah pendaftar per status.
create or replace function hitung_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
  select case when is_approver() then
    json_build_object(
      'menunggu',  count(*) filter (where status = 'menunggu'),
      'diperiksa', count(*) filter (where status = 'diperiksa'),
      'disetujui', count(*) filter (where status = 'disetujui'))
  else '{}'::json end
  from permintaan_jastip
$$;
grant execute on function hitung_permintaan_jastip() to authenticated;


-- =====================================================================
-- 6. STORAGE: bucket bukti (maks 5 MB, hanya gambar)
--    Upload hanya ke folder sesi yang rekapnya sudah terbit (folder = kode sesi).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti', 'bukti', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy b1 on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'bukti' and kode_settled((storage.foldername(name))[1]));


-- =====================================================================
-- 7. REALTIME: tabel profiles masuk publikasi Realtime (cadangan; frontend
--    saat ini belum subscribe, jadi bagian ini tidak berpengaruh ke tampilan)
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;


-- =====================================================================
-- 8. DATA AWAL
-- =====================================================================
-- Email yang otomatis disetujui saat mendaftar (ganti bila perlu).
insert into allowed_jastip values ('vifie14@gmail.com') on conflict do nothing;
-- Akun yang SUDAH ada sebelum skrip ini dijalankan dianggap sudah disetujui.
insert into permintaan_jastip (user_id, email, nama, status)
select u.id, lower(u.email),
       coalesce(nullif(u.raw_user_meta_data->>'nama', ''), split_part(u.email, '@', 1)), 'disetujui'
from auth.users u
where not exists (select 1 from permintaan_jastip r where r.user_id = u.id);
