-- Banner discounts for team sponsors, and linking sponsor records across years.

-- ---------------------------------------------------------------------------
-- Discount lines on a sign-up (kind = 'discount', zero or negative amount)
-- ---------------------------------------------------------------------------
alter table public.registration_items drop constraint registration_items_kind_check;
alter table public.registration_items drop constraint registration_items_price_cents_check;
alter table public.registration_items
  add constraint registration_items_kind_check check (kind in ('team', 'banner', 'discount')),
  add constraint registration_items_price_check check (
    (kind = 'discount' and price_cents <= 0) or (kind <> 'discount' and price_cents >= 0)
  );

-- Per-season banner discount. banner_tiers[1] is taken off the banner for the
-- sponsor's 1st team, banner_tiers[2] for their 2nd team, and so on (amounts in cents).
create table public.season_discounts (
  season text primary key,
  banner_tiers int[] not null default '{}' check (0 <= all (banner_tiers)),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sponsor links: treat records with different emails/names as one sponsor.
-- member_key and group_key are the keys Past sponsors groups by: the email,
-- or "company:<name>" when a sign-up has no email.
-- ---------------------------------------------------------------------------
create table public.sponsor_links (
  member_key text primary key,
  group_key text not null,
  created_at timestamptz not null default now(),
  created_by text,
  check (member_key <> group_key)
);

alter table public.season_discounts enable row level security;
alter table public.sponsor_links enable row level security;

create policy "admins manage season discounts" on public.season_discounts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage sponsor links" on public.sponsor_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.season_discounts, public.sponsor_links to authenticated, service_role;
revoke all on public.season_discounts, public.sponsor_links from anon;
