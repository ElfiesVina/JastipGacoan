-- Hardening Titip Gacoan, 15 Okt 2026.
-- Jalankan SEKALI di Supabase > SQL Editor, SETELAH schema.sql. Aman diulang.

-- 1. Batasan data supaya nilai aneh ditolak database
alter table sesi drop constraint if exists sesi_status_chk;
alter table sesi add constraint sesi_status_chk check (status in ('open','closed','settled')) not valid;
alter table sesi drop constraint if exists sesi_pajak_chk;
alter table sesi add constraint sesi_pajak_chk check (pajak >= 0 and pajak <= 100) not valid;
alter table sesi drop constraint if exists sesi_fee_chk;
alter table sesi add constraint sesi_fee_chk check (fee >= 0 and fee <= 1000000) not valid;
alter table pesanan drop constraint if exists pesanan_level_chk;
alter table pesanan add constraint pesanan_level_chk check (level is null or level ~ '^[1-8]?$') not valid;

-- 2. Index untuk query yang dipakai RLS dan daftar pesanan
create index if not exists pesanan_sesi_idx on pesanan(sesi_id);
create index if not exists sesi_owner_idx on sesi(owner);

-- 3. tambah_pesanan: kini mengembalikan true/false (false = ditolak: ditutup, kosong, atau penuh).
--    Level hanya 1-8, maksimal 300 baris per sesi (anti spam).
drop function if exists tambah_pesanan(text,text,text,text);
create function tambah_pesanan(k text,n text,i text,l text) returns boolean language plpgsql security definer set search_path=public as $$
declare sid uuid;
begin
  select id into sid from sesi where kode=k and status='open';
  if sid is null or length(trim(n))=0 or length(trim(i))=0 then return false; end if;
  if (select count(*) from pesanan where sesi_id=sid)>=300 then return false; end if;
  insert into pesanan(sesi_id,nama,item,level) values(sid,left(trim(n),60),left(trim(i),60),case when l ~ '^[1-8]$' then l else '' end);
  return true;
end $$;
grant execute on function tambah_pesanan(text,text,text,text) to anon, authenticated;

-- 4. tandai_bayar: link bukti hanya boleh dari Storage bucket 'bukti' milik proyek Supabase (cegah javascript: / situs lain)
create or replace function tandai_bayar(k text,n text,b text) returns void language sql security definer set search_path=public as $$
update pesanan set paid=true,
  bukti=coalesce(case when b ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/bukti/' then b end,bukti)
where sesi_id=(select id from sesi where kode=k and status='settled') and lower(trim(nama))=lower(trim(n)) $$;

-- 5. Bucket bukti: maksimal 5 MB, hanya gambar
update storage.buckets set file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='bukti';

-- 6. Upload bukti hanya ke folder sesi yang rekapnya sudah terbit (folder = kode sesi)
create or replace function kode_settled(k text) returns boolean language sql security definer set search_path=public as $$
select exists(select 1 from sesi where kode=k and status='settled') $$;
drop policy if exists b1 on storage.objects;
create policy b1 on storage.objects for insert to anon,authenticated with check(bucket_id='bukti' and kode_settled((storage.foldername(name))[1]));
