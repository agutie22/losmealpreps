-- 1. Extend ingredient type set + add custom-line columns
alter table ingredients
  drop constraint ingredients_type_check,
  add  constraint ingredients_type_check
       check (type in ('protein','carb','veggie','sauce','flavor'));

alter table ingredients
  add column available_as_side boolean not null default false,
  add column display_order     int     not null default 0;

-- 2. Size variants — proteins (6oz/8oz) and side-sauces (2oz/8oz)
create table ingredient_variants (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  size_label    text not null,
  calories      int          not null,
  protein_g     numeric(5,1) not null,
  carbs_g       numeric(5,1) not null,
  fat_g         numeric(5,1) not null,
  price_cents   int          not null,
  is_default    boolean      not null default false,
  display_order int          not null default 0,
  unique (ingredient_id, size_label)
);

-- 3. Custom-meal rules — single row enforced by PK + CHECK
create table custom_meal_config (
  id                    int primary key default 1 check (id = 1),
  base_price_cents      int not null,
  included_veggie_count int not null default 2,
  included_sauce_count  int not null default 1,
  max_veggie_count      int not null default 4,
  updated_at            timestamptz not null default now()
);

-- 4. RLS — match pattern from 0004
alter table ingredient_variants enable row level security;
alter table custom_meal_config  enable row level security;

create policy "public read variants" on ingredient_variants
  for select using (true);
create policy "admin write variants" on ingredient_variants
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

create policy "public read config" on custom_meal_config
  for select using (true);
create policy "admin write config" on custom_meal_config
  for all using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

-- Seed the single config row (base price set to 0 — update via admin UI)
insert into custom_meal_config (id, base_price_cents)
  values (1, 0)
  on conflict (id) do nothing;
