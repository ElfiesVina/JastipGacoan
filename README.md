# Titip Gacoan

Aplikasi titip pesanan Gacoan. Statis (satu `index.html`), data di Supabase, deploy di Vercel.

## Berkas
- `index.html` : seluruh UI dan logika
- `config.js` : URL dan anon key Supabase (anon key memang publik; keamanannya dijaga RLS)
- `changelog.js` : daftar "Yang baru" untuk admin dan penitip
- `schema.sql` : buat tabel, RLS, fungsi (instalasi awal)
- `migrasi-2026-10-15.sql` : hardening (versi sudah dikoreksi), jalankan setelah `schema.sql`, aman diulang
- `AUDIT.md` : hasil audit kode

## Pasang database
1. Supabase > SQL Editor, jalankan `schema.sql`
2. Lalu jalankan `migrasi-2026-10-15.sql`

## Menambah catatan perubahan
Buka `changelog.js`, taruh entri baru di paling atas dengan `id` satu angka di atas yang terakhir.
Isi `untuk` dengan `'semua'`, `'admin'`, atau `'penitip'`. Setelah deploy, lonceng di header
menampilkan angka untuk entri yang belum dibuka. Status "sudah dibaca" disimpan di browser masing-masing.

## Membatasi siapa yang boleh jadi jastip
Tanpa ini, siapa pun yang tahu alamat aplikasi bisa menekan Daftar. Jalankan sekali di Supabase > SQL Editor
(ganti emailnya dengan email jastip pertama):

```sql
create table if not exists allowed_jastip(email text primary key);
alter table allowed_jastip enable row level security;
insert into allowed_jastip values('EMAILMU@contoh.com') on conflict do nothing;
create or replace function cek_jastip() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from allowed_jastip where lower(email)=lower(new.email)) then raise exception 'Email belum diizinkan jadi jastip'; end if;
 return new; end $$;
drop trigger if exists t_cek_jastip on auth.users;
create trigger t_cek_jastip before insert on auth.users for each row execute function cek_jastip();
```

Menambah jastip baru: jalankan `insert into allowed_jastip values('email@teman.com');`, lalu orangnya menekan Daftar di aplikasi.
