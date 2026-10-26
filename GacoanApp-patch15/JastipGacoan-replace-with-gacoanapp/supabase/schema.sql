create table profiles(id uuid primary key references auth.users on delete cascade,nama text,rek text,wa text);
create table sesi(id uuid primary key default gen_random_uuid(),kode text unique not null,owner uuid not null references auth.users on delete cascade,judul text,waktu text,status text not null default 'open',pajak numeric not null default 10,fee int not null default 0,tgl date not null default current_date,prices jsonb not null default '{}',created_at timestamptz default now());
create table pesanan(id uuid primary key default gen_random_uuid(),sesi_id uuid not null references sesi on delete cascade,nama text not null,item text not null,level text,paid boolean not null default false,bukti text,created_at timestamptz default now());
alter table profiles enable row level security;alter table sesi enable row level security;alter table pesanan enable row level security;
create policy p1 on profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy s1 on sesi for all to authenticated using(owner=auth.uid()) with check(owner=auth.uid());
create policy o1 on pesanan for all to authenticated using(exists(select 1 from sesi s where s.id=sesi_id and s.owner=auth.uid())) with check(exists(select 1 from sesi s where s.id=sesi_id and s.owner=auth.uid()));
create function get_sesi(k text) returns json language sql security definer set search_path=public as $$
select json_build_object('id',s.id,'judul',s.judul,'status',s.status,'pajak',s.pajak,'fee',s.fee,'tgl',s.tgl,'waktu',s.waktu,'prices',s.prices,'nama',p.nama,'rek',p.rek,'wa',p.wa) from sesi s left join profiles p on p.id=s.owner where s.kode=k $$;
create function list_pesanan(k text) returns json language sql security definer set search_path=public as $$
select coalesce(json_agg(json_build_object('id',o.id,'nama',o.nama,'item',o.item,'level',o.level,'paid',o.paid,'bukti',o.bukti) order by o.created_at),'[]'::json) from pesanan o join sesi s on s.id=o.sesi_id where s.kode=k $$;
create function tambah_pesanan(k text,n text,i text,l text) returns void language sql security definer set search_path=public as $$
insert into pesanan(sesi_id,nama,item,level) select id,left(trim(n),60),left(trim(i),60),left(l,2) from sesi where kode=k and status='open' and length(trim(n))>0 and length(trim(i))>0 $$;
create function tandai_bayar(k text,n text,b text) returns void language sql security definer set search_path=public as $$
update pesanan set paid=true,bukti=coalesce(b,bukti) where sesi_id=(select id from sesi where kode=k and status='settled') and lower(trim(nama))=lower(trim(n)) $$;
insert into storage.buckets(id,name,public) values('bukti','bukti',true) on conflict do nothing;
create policy b1 on storage.objects for insert to anon,authenticated with check(bucket_id='bukti');
