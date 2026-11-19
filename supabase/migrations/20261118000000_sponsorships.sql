-- RWCLL Sponsorships: core schema.
--
-- Access model
--   * Public (anonymous) visitors never touch these tables directly. The public
--     sign-up form and printable invoice pages run on the server with the
--     secret key and only expose what they need.
--   * Signed-in admins (emails listed in public.admins) get full access via RLS.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  current_season text not null,
  registration_open boolean not null default true,
  email_notifications boolean not null default false,
  -- Comma-separated addresses that get a "new sponsor" email.
  notify_emails text not null default '',
  payment_instructions text not null default '',
  -- Path inside the public "site" storage bucket.
  zelle_qr_path text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Packages (what a sponsor can pick), per season
-- ---------------------------------------------------------------------------
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  kind text not null check (kind in ('team', 'banner')),
  name text not null,
  price_cents int not null check (price_cents >= 0),
  sort_order int not null default 0,
  active boolean not null default true,
  unique (season, name)
);

-- ---------------------------------------------------------------------------
-- Registrations (one per form submission)
-- ---------------------------------------------------------------------------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  -- Invoice number within the season (2027-0001, 2027-0002, ...). Set by trigger.
  number int not null default 0,
  -- Unguessable token for the sponsor's printable invoice/receipt link.
  public_token uuid not null unique default gen_random_uuid(),
  season text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  email text not null,
  company_name text not null,
  contact_name text not null,
  address text not null,
  phone text not null,
  -- "I don't know what division to sponsor" was checked.
  needs_division_help boolean not null default false,
  -- Player name and division, if the sponsor has a player in the league.
  player_info text,

  logo_path text,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'cancelled')),
  notes text,
  -- Brought over from the old Google Form; payments weren't tracked there.
  imported boolean not null default false,
  unique (season, number)
);

-- Number each sign-up within its season. The lock keeps two sign-ups that
-- arrive at the same moment from getting the same number.
create or replace function public.number_registration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('registration-number:' || new.season));
  select coalesce(max(r.number), 0) + 1 into new.number
  from public.registrations r
  where r.season = new.season;
  return new;
end;
$$;

create trigger registrations_number before insert on public.registrations
  for each row execute function public.number_registration();

create index registrations_season_idx on public.registrations (season);
create index registrations_email_idx on public.registrations (lower(email));

-- Packages chosen on a registration. Name and price are copied so changing a
-- package later never changes an invoice that was already sent.
create table public.registration_items (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  package_id uuid references public.packages (id) on delete set null,
  kind text not null check (kind in ('team', 'banner')),
  name text not null,
  price_cents int not null check (price_cents >= 0)
);

create index registration_items_registration_idx on public.registration_items (registration_id);

-- ---------------------------------------------------------------------------
-- Payments (recorded by admins; a registration can have several)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  method text not null check (method in ('check', 'zelle', 'cash', 'other')),
  reference text,
  received_on date not null default current_date,
  recorded_by text,
  created_at timestamptz not null default now()
);

create index payments_registration_idx on public.payments (registration_id);

-- ---------------------------------------------------------------------------
-- Totals view
-- ---------------------------------------------------------------------------
create view public.registration_totals
with (security_invoker = true)
as
select
  r.id as registration_id,
  coalesce((select sum(i.price_cents) from public.registration_items i where i.registration_id = r.id), 0)::int as total_cents,
  coalesce((select sum(p.amount_cents) from public.payments p where p.registration_id = r.id), 0)::int as paid_cents
from public.registrations r;

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger registrations_touch before update on public.registrations
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: admins only
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.packages enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_items enable row level security;
alter table public.payments enable row level security;

create policy "admins manage admins" on public.admins
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage packages" on public.packages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage registrations" on public.registrations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage registration items" on public.registration_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage payments" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Storage
--   logos: private. Sponsors upload through the server; admins view/replace.
--   site:  public. Holds the Zelle QR code shown on the form and invoices.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos', 'logos', false, 10485760, null),
  ('site', 'site', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "admins read logos" on storage.objects
  for select to authenticated using (bucket_id = 'logos' and public.is_admin());
create policy "admins write logos" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos' and public.is_admin());
create policy "admins update logos" on storage.objects
  for update to authenticated using (bucket_id = 'logos' and public.is_admin());
create policy "admins delete logos" on storage.objects
  for delete to authenticated using (bucket_id = 'logos' and public.is_admin());

create policy "admins write site" on storage.objects
  for insert to authenticated with check (bucket_id = 'site' and public.is_admin());
create policy "admins update site" on storage.objects
  for update to authenticated using (bucket_id = 'site' and public.is_admin());
create policy "admins delete site" on storage.objects
  for delete to authenticated using (bucket_id = 'site' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Starting data: 2027 season packages and settings
-- ---------------------------------------------------------------------------
insert into public.settings (id, current_season, payment_instructions)
values (
  1,
  '2027',
  E'Please use the QR code to pay for your sponsorship with Zelle.\n\n'
  'If you would rather send a check, please make the check out to Redwood City Little League '
  'for the amount of your total sponsorship and send it to the following address:\n\n'
  'Redwood City Little League, c/o Chris Trester\n'
  '216 Kingsford Lane\n'
  'Redwood City, CA 94061'
);

insert into public.packages (season, kind, name, price_cents, sort_order) values
  ('2027', 'team',   'T-Ball team',      50000, 10),
  ('2027', 'team',   'A Ball team',      50000, 20),
  ('2027', 'team',   'AA team',          50000, 30),
  ('2027', 'team',   'AAA team',         60000, 40),
  ('2027', 'team',   'Majors team',      60000, 50),
  ('2027', 'team',   'Juniors team',     60000, 60),
  ('2027', 'banner', 'Kiwanis banner', 50000, 70);
