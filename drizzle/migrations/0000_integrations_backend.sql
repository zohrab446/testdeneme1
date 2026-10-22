create extension if not exists pgcrypto with schema extensions;

create type public.membership_role as enum ('sahip', 'ik', 'departman_yoneticisi', 'salt_okunur');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  role public.membership_role not null default 'salt_okunur',
  department_id uuid,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);
grant select, insert, update, delete on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;

create or replace function public.is_company_member(_company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where company_id = _company_id and user_id = auth.uid())
$$;

create or replace function public.has_company_role(_company_id uuid, _roles public.membership_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where company_id = _company_id and user_id = auth.uid() and role = any(_roles))
$$;

create or replace function public.my_membership(_company_id uuid)
returns public.memberships language sql stable security definer set search_path = public as $$
  select * from public.memberships where company_id = _company_id and user_id = auth.uid() limit 1
$$;

create policy "Uyeler sirketi gorebilir" on public.companies for select to authenticated using (public.is_company_member(id));
create policy "Giris yapan sirket olusturabilir" on public.companies for insert to authenticated with check (true);
create policy "Sahip sirketi guncelleyebilir" on public.companies for update to authenticated using (public.has_company_role(id, array['sahip']::public.membership_role[]));

create policy "Uyeler uyelikleri gorebilir" on public.memberships for select to authenticated using (public.is_company_member(company_id));
create policy "Ilk uye veya yonetici ekleyebilir" on public.memberships for insert to authenticated with check (
  user_id = auth.uid() and (
    not exists (select 1 from public.memberships m where m.company_id = memberships.company_id)
    or public.has_company_role(company_id, array['sahip','ik']::public.membership_role[])
  )
);
create policy "Sahip uyelikleri guncelleyebilir" on public.memberships for update to authenticated using (public.has_company_role(company_id, array['sahip']::public.membership_role[]));
create policy "Sahip uyelikleri silebilir" on public.memberships for delete to authenticated using (public.has_company_role(company_id, array['sahip']::public.membership_role[]));

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  status text not null default 'bagli_degil' check (status in ('bagli','bagli_degil','hata','yakinda')),
  auth_type text not null default 'api_key',
  scopes text[] not null default '{}',
  config jsonb not null default '{}',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  error_code text,
  error_message text,
  consecutive_failures int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, provider)
);
grant select, insert, update, delete on public.integrations to authenticated;
grant all on public.integrations to service_role;
alter table public.integrations enable row level security;
create policy "Uyeler entegrasyonlari gorebilir" on public.integrations for select to authenticated using (public.is_company_member(company_id));
create policy "Yoneticiler entegrasyon ekleyebilir" on public.integrations for insert to authenticated with check (public.has_company_role(company_id, array['sahip','ik']::public.membership_role[]));
create policy "Yoneticiler entegrasyon guncelleyebilir" on public.integrations for update to authenticated using (public.has_company_role(company_id, array['sahip','ik']::public.membership_role[]));
create policy "Yoneticiler entegrasyon silebilir" on public.integrations for delete to authenticated using (public.has_company_role(company_id, array['sahip','ik']::public.membership_role[]));

create table public.integration_secrets (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  key text not null,
  value_encrypted bytea not null,
  created_at timestamptz not null default now(),
  unique (integration_id, key)
);
grant all on public.integration_secrets to service_role;
alter table public.integration_secrets enable row level security;

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'calisiyor' check (status in ('calisiyor','basarili','hata')),
  records_fetched int not null default 0,
  error text
);
grant select on public.sync_runs to authenticated;
grant all on public.sync_runs to service_role;
alter table public.sync_runs enable row level security;
create policy "Uyeler senkron kayitlarini gorebilir" on public.sync_runs for select to authenticated using (
  exists (select 1 from public.integrations i where i.id = integration_id and public.is_company_member(i.company_id))
);

create table public.raw_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source text not null,
  external_id text not null,
  author_hash text,
  text text not null,
  created_at timestamptz not null default now(),
  sentiment text check (sentiment in ('pozitif','notr','negatif')),
  topics text[] not null default '{}',
  department_id uuid,
  analyzed_at timestamptz,
  unique (company_id, source, external_id)
);
grant select on public.raw_items to authenticated;
grant all on public.raw_items to service_role;
alter table public.raw_items enable row level security;
create policy "Uyeler ham veriyi gorebilir" on public.raw_items for select to authenticated using (
  public.is_company_member(company_id) and (
    not public.has_company_role(company_id, array['departman_yoneticisi']::public.membership_role[])
    or department_id is null
    or department_id = (public.my_membership(company_id)).department_id
  )
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  provider text not null,
  accepted_at timestamptz not null default now(),
  policy_version text not null,
  unique (company_id, user_id, provider)
);
grant select, insert on public.consents to authenticated;
grant all on public.consents to service_role;
alter table public.consents enable row level security;
create policy "Uyeler onaylari gorebilir" on public.consents for select to authenticated using (public.is_company_member(company_id));
create policy "Kullanici kendi onayini ekleyebilir" on public.consents for insert to authenticated with check (user_id = auth.uid() and public.is_company_member(company_id));

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid,
  action text not null,
  detail jsonb not null default '{}',
  at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "Uyeler denetim kaydini gorebilir" on public.audit_log for select to authenticated using (public.is_company_member(company_id));

create or replace function public.store_integration_secret(_integration_id uuid, _key text, _value text, _encryption_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.integration_secrets (integration_id, key, value_encrypted)
  values (_integration_id, _key, extensions.pgp_sym_encrypt(_value, _encryption_key))
  on conflict (integration_id, key) do update set value_encrypted = excluded.value_encrypted;
end;
$$;

create or replace function public.read_integration_secret(_integration_id uuid, _key text, _encryption_key text)
returns text language sql stable security definer set search_path = public as $$
  select extensions.pgp_sym_decrypt(value_encrypted, _encryption_key)
  from public.integration_secrets
  where integration_id = _integration_id and key = _key limit 1
$$;

create or replace function public.delete_integration_secrets(_integration_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.integration_secrets where integration_id = _integration_id
$$;

revoke all on function public.store_integration_secret(uuid, text, text, text) from authenticated, anon;
revoke all on function public.read_integration_secret(uuid, text, text) from authenticated, anon;
revoke all on function public.delete_integration_secrets(uuid) from authenticated, anon;
grant execute on function public.store_integration_secret(uuid, text, text, text) to service_role;
grant execute on function public.read_integration_secret(uuid, text, text) to service_role;
grant execute on function public.delete_integration_secrets(uuid) to service_role;