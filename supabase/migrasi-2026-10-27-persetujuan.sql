-- Persetujuan pendaftaran jastip (versi 2), 27 Okt 2026.
-- Jalankan SEKALI di Supabase > SQL Editor, SETELAH batasi-jastip.sql dan migrasi-2026-10-26-title-cojastip.sql.
-- Aman diulang, dan aman dijalankan walau versi 1 file ini sudah pernah dijalankan (isinya digantikan).
--
-- Cara kerja baru:
--  - Siapa saja boleh mendaftar (nama, email, password, alasan). Akunnya langsung dibuat, tapi statusnya
--    'menunggu' sampai developer atau Co Jastip menyetujui di tab Persetujuan.
--  - Akun yang belum disetujui tidak bisa membuat sesi (dicek di database, bukan hanya di tampilan).
--  - Email yang sudah ada di allowed_jastip dan semua akun yang sudah ada sebelum migrasi ini
--    otomatis berstatus 'disetujui'.

create table if not exists permintaan_jastip (
  id     uuid primary key default gen_random_uuid(),
  email  text not null,
  nama   text not null,
  status text not null default 'menunggu' check (status in ('menunggu', 'disetujui', 'ditolak')),
  dibuat timestamptz not null default now()
);
alter table permintaan_jastip add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table permintaan_jastip add column if not exists alasan text not null default '';

-- Pengajuan lama (versi 1, tanpa akun) dibuang: sekarang pendaftaran = pengajuan.
delete from permintaan_jastip where user_id is null;
drop index if exists permintaan_jastip_menunggu_uq;
create unique index if not exists permintaan_jastip_user_uq on permintaan_jastip (user_id);
create index if not exists permintaan_jastip_email_idx on permintaan_jastip (lower(email));

-- tabel tertutup: tanpa kebijakan RLS, jadi HANYA bisa lewat fungsi di bawah
alter table permintaan_jastip enable row level security;

drop function if exists ajukan_jastip(text, text, text); -- form pengajuan lama sudah tidak dipakai

-- Akun yang sudah ada sebelum migrasi ini dianggap sudah disetujui.
insert into permintaan_jastip (user_id, email, nama, status)
select u.id, lower(u.email), coalesce(nullif(u.raw_user_meta_data->>'nama', ''), split_part(u.email, '@', 1)), 'disetujui'
from auth.users u
where not exists (select 1 from permintaan_jastip r where r.user_id = u.id);

-- Pendaftaran tidak lagi ditolak di pintu masuk; sebagai gantinya tiap akun baru dicatat di bawah.
drop trigger if exists t_cek_jastip on auth.users;

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
drop trigger if exists t_buat_permintaan_jastip on auth.users;
create trigger t_buat_permintaan_jastip after insert on auth.users
  for each row execute function buat_permintaan_jastip();

-- true bila akun yang sedang login adalah Co Jastip.
create or replace function is_cojastip() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select cojastip from profiles where id = auth.uid()), false)
$$;
grant execute on function is_cojastip() to authenticated;

-- Yang boleh menyetujui: developer atau Co Jastip.
create or replace function is_approver() returns boolean
language sql stable security definer set search_path = public as $$
  select is_developer() or is_cojastip()
$$;
grant execute on function is_approver() to authenticated;

-- true bila akun yang sedang login sudah disetujui (developer selalu lolos).
create or replace function is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select is_developer()
      or exists (select 1 from permintaan_jastip where user_id = auth.uid() and status = 'disetujui')
$$;
grant execute on function is_approved() to authenticated;

-- Akun yang belum disetujui TIDAK boleh membuat sesi. Kebijakan "restrictive" ini ditambahkan di atas s1.
drop policy if exists sesi_wajib_disetujui on sesi;
create policy sesi_wajib_disetujui on sesi as restrictive for insert to authenticated
  with check (is_approved());

-- Status pendaftaran untuk halaman Pending (juga dipakai sebelum email dikonfirmasi, jadi anon boleh).
-- Hanya mengembalikan satu kata: menunggu | disetujui | ditolak (atau kosong bila email tidak dikenal).
create or replace function status_pendaftaran(p_email text) returns text
language sql stable security definer set search_path = public as $$
  select status from permintaan_jastip
  where lower(email) = lower(trim(coalesce(p_email, '')))
  order by dibuat desc limit 1
$$;
grant execute on function status_pendaftaran(text) to anon, authenticated;

-- Daftar pendaftar yang menunggu. KOSONG bila pemanggilnya bukan developer/Co Jastip.
create or replace function list_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
  select case when is_approver() then
    coalesce((select json_agg(json_build_object(
        'id', r.id, 'email', r.email, 'nama', r.nama, 'alasan', r.alasan, 'dibuat', r.dibuat
      ) order by r.dibuat)
      from permintaan_jastip r where r.status = 'menunggu'), '[]'::json)
  else '[]'::json end
$$;
grant execute on function list_permintaan_jastip() to authenticated;

-- Setujui / tolak. Menolak (raise exception) bila pemanggilnya BUKAN developer/Co Jastip.
create or replace function putuskan_permintaan_jastip(target uuid, setuju boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_approver() then
    raise exception 'Hanya developer atau Co Jastip yang boleh memutuskan pendaftaran';
  end if;
  update permintaan_jastip set status = case when setuju then 'disetujui' else 'ditolak' end
    where id = target and status = 'menunggu';
  if not found then
    raise exception 'Pendaftaran tidak ditemukan atau sudah diproses';
  end if;
end $$;
grant execute on function putuskan_permintaan_jastip(uuid, boolean) to authenticated;

-- PENGAMAN: title Co Jastip sekarang memberi hak menyetujui, jadi HANYA developer yang boleh mengubah kolom
-- cojastip (lewat set_cojastip). Tanpa ini, pemilik profil bisa mengisi kolomnya sendiri lewat kebijakan p1.
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
drop trigger if exists t_jaga_cojastip on profiles;
create trigger t_jaga_cojastip before insert or update on profiles
  for each row execute function jaga_cojastip();
