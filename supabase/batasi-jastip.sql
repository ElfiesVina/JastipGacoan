-- Membatasi siapa yang boleh mendaftar jadi jastip.
-- Jalankan SEKALI di Supabase > SQL Editor (ganti emailnya dengan email jastip pertama).
create table if not exists allowed_jastip(email text primary key);
alter table allowed_jastip enable row level security;
insert into allowed_jastip values('vifie14@gmail.com') on conflict do nothing;
create or replace function cek_jastip() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from allowed_jastip where lower(email)=lower(new.email)) then raise exception 'Email belum diizinkan jadi jastip'; end if;
 return new; end $$;
drop trigger if exists t_cek_jastip on auth.users;
create trigger t_cek_jastip before insert on auth.users for each row execute function cek_jastip();
-- Menambah jastip baru: insert into allowed_jastip values('email@teman.com');
