-- === ingredients: atomic units customers can swap ===
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('protein','carb','veggie','sauce')),
  image_url text,
  calories int not null default 0,
  protein_g numeric(5,1) not null default 0,
  carbs_g numeric(5,1) not null default 0,
  fat_g numeric(5,1) not null default 0,
  upcharge_cents int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- === meals: pre-composed dishes, customizable ===
create table meals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  hero_image_url text not null,
  base_price_cents int not null,
  category text not null,
  rating numeric(2,1),
  rating_count int default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- === default loadout for each meal ===
create table meal_default_ingredients (
  meal_id uuid references meals(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete restrict,
  primary key (meal_id, ingredient_id)
);

-- === ingredients that can be swapped IN to a given meal ===
create table meal_swap_options (
  meal_id uuid references meals(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete restrict,
  primary key (meal_id, ingredient_id)
);

-- === bundles: tier configurations ===
create table bundles (
  id uuid primary key default gen_random_uuid(),
  tier text not null unique check (tier in ('standard','premium')),
  display_name text not null,
  tagline text,
  slot_count int not null,
  base_price_cents int not null,
  per_slot_savings_cents int not null default 0,
  hero_image_url text,
  is_active boolean not null default true
);
