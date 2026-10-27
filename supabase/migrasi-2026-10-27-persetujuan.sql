-- Persetujuan pendaftaran admin jastip, 27 Okt 2026.
-- Jalankan SEKALI di Supabase > SQL Editor, SETELAH batasi-jastip.sql dan migrasi-2026-10-26-title-cojastip.sql.
-- Aman diulang.
--
-- Cara kerja: daftar email yang diizinkan (allowed_jastip) TETAP menjadi pintu pendaftaran.
-- Orang yang belum diizinkan mengajukan diri lewat tombol "Ajukan persetujuan" di layar daftar.
-- Developer menyetujui di tab Persetujuan: emailnya otomatis masuk allowed_jastip, lalu orang itu
-- mendaftar seperti biasa. Menolak hanya menandai pengajuan; tidak ada akun yang dibuat.

create table if not exists permintaan_jastip (
  id     uuid primary key default gen_random_uuid(),
  email  text not null,
  nama   text not null,
  pesan  text not null default '',
  status text not null default 'menunggu' check (status in ('menunggu', 'disetujui', 'ditolak')),
  dibuat timestamptz not null default now()
);

-- satu pengajuan menunggu per email
create unique index if not exists permintaan_jastip_menunggu_uq
  on permintaan_jastip (lower(email)) where status = 'menunggu';

-- tabel tertutup: tanpa kebijakan RLS, jadi HANYA bisa lewat fungsi di bawah
alter table permintaan_jastip enable row level security;

-- Mengajukan diri (boleh dipanggil sebelum login).
create or replace function ajukan_jastip(p_email text, p_nama text, p_pesan text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_nama  text := trim(coalesce(p_nama, ''));
  v_pesan text := trim(coalesce(p_pesan, ''));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 120 then
    raise exception 'Format email tidak valid';
  end if;
  if length(v_nama) < 2 or length(v_nama) > 60 then
    raise exception 'Nama harus 2-60 karakter';
  end if;
  if length(v_pesan) > 200 then
    raise exception 'Pesan maksimal 200 karakter';
  end if;
  if exists (select 1 from allowed_jastip where lower(email) = v_email) then
    raise exception 'Email ini sudah diizinkan, silakan daftar';
  end if;
  if (select count(*) from permintaan_jastip where status = 'menunggu') >= 200 then
    raise exception 'Antrean pengajuan penuh, coba lagi nanti';
  end if;
  if exists (select 1 from permintaan_jastip where lower(email) = v_email and status = 'menunggu') then
    update permintaan_jastip set nama = v_nama, pesan = v_pesan
      where lower(email) = v_email and status = 'menunggu';
  else
    insert into permintaan_jastip (email, nama, pesan) values (v_email, v_nama, v_pesan);
  end if;
end $$;
grant execute on function ajukan_jastip(text, text, text) to anon, authenticated;

-- Daftar pengajuan yang menunggu. KOSONG bila pemanggilnya bukan developer.
create or replace function list_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
  select case when is_developer() then
    coalesce((select json_agg(json_build_object(
        'id', r.id, 'email', r.email, 'nama', r.nama, 'pesan', r.pesan, 'dibuat', r.dibuat
      ) order by r.dibuat)
      from permintaan_jastip r where r.status = 'menunggu'), '[]'::json)
  else '[]'::json end
$$;
grant execute on function list_permintaan_jastip() to authenticated;

-- Setujui / tolak. Menolak (raise exception) bila pemanggilnya BUKAN developer.
create or replace function putuskan_permintaan_jastip(target uuid, setuju boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if not is_developer() then
    raise exception 'Hanya developer yang boleh memutuskan pengajuan';
  end if;
  select email into v_email from permintaan_jastip where id = target and status = 'menunggu';
  if v_email is null then
    raise exception 'Pengajuan tidak ditemukan atau sudah diproses';
  end if;
  if setuju then
    insert into allowed_jastip values (v_email) on conflict do nothing;
  end if;
  update permintaan_jastip set status = case when setuju then 'disetujui' else 'ditolak' end where id = target;
end $$;
grant execute on function putuskan_permintaan_jastip(uuid, boolean) to authenticated;
