-- Jalankan setelah migrasi-2026-10-27-persetujuan.sql. Aman diulang.
-- Menambah status 'diperiksa' pada pendaftaran jastip.
-- Catatan: pengiriman kode verifikasi (OTP) harus dibuat di Edge Function/server tepercaya, bukan di sini.

alter table public.permintaan_jastip drop constraint if exists permintaan_jastip_status_check;
alter table public.permintaan_jastip add constraint permintaan_jastip_status_check
  check (status in ('menunggu', 'diperiksa', 'disetujui', 'ditolak'));

-- Daftar pendaftar yang masih berjalan (menunggu + diperiksa). KOSONG bila pemanggilnya bukan developer/Co Jastip.
create or replace function public.list_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
  select case when is_approver() then
    coalesce((select json_agg(json_build_object(
        'id', r.id, 'email', r.email, 'nama', r.nama,
        'alasan', r.alasan, 'status', r.status, 'dibuat', r.dibuat)
      order by case r.status when 'menunggu' then 0 when 'diperiksa' then 1 else 2 end, r.dibuat)
      from permintaan_jastip r where r.status in ('menunggu', 'diperiksa')), '[]'::json)
  else '[]'::json end
$$;
grant execute on function public.list_permintaan_jastip() to authenticated;

-- Mulai memeriksa: menunggu -> diperiksa.
create or replace function public.mulai_periksa_permintaan_jastip(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_approver() then raise exception 'Hanya Developer atau Co Jastip yang boleh memeriksa'; end if;
  update permintaan_jastip set status = 'diperiksa' where id = target and status = 'menunggu';
  if not found then raise exception 'Pendaftaran tidak ditemukan atau sudah diproses'; end if;
end $$;
grant execute on function public.mulai_periksa_permintaan_jastip(uuid) to authenticated;

-- Setujui / tolak: boleh dari 'menunggu' maupun 'diperiksa'.
create or replace function public.putuskan_permintaan_jastip(target uuid, setuju boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_approver() then raise exception 'Hanya Developer atau Co Jastip yang boleh memutuskan'; end if;
  update permintaan_jastip set status = case when setuju then 'disetujui' else 'ditolak' end
    where id = target and status in ('menunggu', 'diperiksa');
  if not found then raise exception 'Pendaftaran tidak ditemukan atau sudah diproses'; end if;
end $$;
grant execute on function public.putuskan_permintaan_jastip(uuid, boolean) to authenticated;
