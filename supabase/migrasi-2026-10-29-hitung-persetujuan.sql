-- Jalankan setelah migrasi-2026-10-29-status-diperiksa.sql.
-- Ringkasan jumlah pendaftar per status untuk panel Persetujuan (Developer / Co Jastip saja).
create or replace function public.hitung_permintaan_jastip() returns json
language sql stable security definer set search_path = public as $$
 select case when is_approver() then
  json_build_object(
   'menunggu',  count(*) filter (where status = 'menunggu'),
   'diperiksa', count(*) filter (where status = 'diperiksa'),
   'disetujui', count(*) filter (where status = 'disetujui'))
 else '{}'::json end
 from permintaan_jastip
$$;
grant execute on function public.hitung_permintaan_jastip() to authenticated;
