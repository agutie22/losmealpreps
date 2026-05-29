-- Bundle redesign: staple/weekly products, configurable slot counts, per-size pricing.

-- Legacy pricing snapshot (standard/premium rows from 0014)
create temp table _legacy_bundles as
  select tier, slot_count, base_price_cents, per_slot_savings_cents
  from bundles;

-- Child tables
create table bundle_slot_options (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references bundles(id) on delete cascade,
  slot_count int not null check (slot_count > 0),
  label text,
  display_order int not null default 0,
  is_default boolean not null default false,
  unique (bundle_id, slot_count)
);

create table bundle_protein_sizes (
  id uuid primary key default gen_random_uuid(),
  bundle_slot_option_id uuid not null references bundle_slot_options(id) on delete cascade,
  size_label text not null,
  price_cents int not null check (price_cents >= 0),
  display_order int not null default 0,
  is_default boolean not null default false,
  unique (bundle_slot_option_id, size_label)
);

-- Replace tier/slot_count/base_price on bundles
alter table bundles
  add column slug text,
  add column meal_type text;

delete from bundles;

alter table bundles drop constraint if exists bundles_tier_check;
alter table bundles drop constraint bundles_tier_key;
alter table bundles drop column tier;
alter table bundles drop column slot_count;
alter table bundles drop column base_price_cents;

alter table bundles
  alter column slug set not null,
  alter column meal_type set not null,
  add constraint bundles_meal_type_check check (meal_type in ('staple', 'weekly')),
  add constraint bundles_slug_key unique (slug);

-- Staple + weekly bundle products
insert into bundles (slug, meal_type, display_name, tagline, per_slot_savings_cents, hero_image_url, is_active)
values
  ('staple', 'staple', 'Staple Bundle', 'Our signature staples — always on the menu', 0, null, true),
  ('weekly', 'weekly', 'Weekly Specials Bundle', 'Chef''s rotating weekly picks', 100, null, true);

-- Slot options + default 6 oz protein size per slot
do $$
declare
  staple_id uuid;
  weekly_id uuid;
  staple_5_id uuid;
  staple_10_id uuid;
  weekly_5_id uuid;
  weekly_10_id uuid;
  std_price int;
  prem_price int;
begin
  select coalesce((select base_price_cents from _legacy_bundles where tier = 'standard'), 6500) into std_price;
  select coalesce((select base_price_cents from _legacy_bundles where tier = 'premium'), 12000) into prem_price;

  select id into staple_id from bundles where slug = 'staple';
  select id into weekly_id from bundles where slug = 'weekly';

  insert into bundle_slot_options (bundle_id, slot_count, label, display_order, is_default)
  values (staple_id, 5, 'Work week', 0, true)
  returning id into staple_5_id;
  insert into bundle_slot_options (bundle_id, slot_count, label, display_order, is_default)
  values (staple_id, 10, 'Full week', 1, false)
  returning id into staple_10_id;

  insert into bundle_slot_options (bundle_id, slot_count, label, display_order, is_default)
  values (weekly_id, 5, 'Work week', 0, true)
  returning id into weekly_5_id;
  insert into bundle_slot_options (bundle_id, slot_count, label, display_order, is_default)
  values (weekly_id, 10, 'Full week', 1, false)
  returning id into weekly_10_id;

  insert into bundle_protein_sizes (bundle_slot_option_id, size_label, price_cents, display_order, is_default)
  values
    (staple_5_id, '6 oz', std_price, 0, true),
    (staple_10_id, '6 oz', prem_price, 0, true),
    (weekly_5_id, '6 oz', std_price + 1000, 0, true),
    (weekly_10_id, '6 oz', prem_price + 2000, 0, true);
end $$;

drop table _legacy_bundles;

-- RLS
alter table bundle_slot_options enable row level security;
alter table bundle_protein_sizes enable row level security;

create policy "Public can view slot options for active bundles" on bundle_slot_options
  for select using (
    exists (select 1 from bundles where bundles.id = bundle_slot_options.bundle_id and bundles.is_active = true)
  );

create policy "Public can view protein sizes for active bundles" on bundle_protein_sizes
  for select using (
    exists (
      select 1 from bundle_slot_options bso
      join bundles b on b.id = bso.bundle_id
      where bso.id = bundle_protein_sizes.bundle_slot_option_id and b.is_active = true
    )
  );

create policy "Admins have full access to bundle_slot_options" on bundle_slot_options
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

create policy "Admins have full access to bundle_protein_sizes" on bundle_protein_sizes
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));
