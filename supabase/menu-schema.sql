create table if not exists public.meal_items (
    id text primary key,
    title text not null,
    description text not null default '',
    image text not null default '',
    price numeric(10,2) not null default 0,
    protein numeric(10,2) not null default 0,
    carbs numeric(10,2) not null default 0,
    fat numeric(10,2) not null default 0,
    calories numeric(10,2) not null default 0,
    is_active boolean not null default true,
    display_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
    id text primary key,
    name text not null,
    category text not null check (category in ('protein', 'carb', 'veggie', 'sauce')),
    price numeric(10,2) not null default 0,
    price_large numeric(10,2),
    protein numeric(10,2) not null default 0,
    carbs numeric(10,2) not null default 0,
    fat numeric(10,2) not null default 0,
    calories numeric(10,2) not null default 0,
    protein_large numeric(10,2),
    carbs_large numeric(10,2),
    fat_large numeric(10,2),
    calories_large numeric(10,2),
    is_premium boolean not null default false,
    is_active boolean not null default true,
    display_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.bundle_deals (
    variant text primary key check (variant in ('standard', 'premium')),
    title text not null,
    subtitle text not null,
    meal_count integer not null default 10,
    price numeric(10,2) not null default 0,
    image text not null default '',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.bundle_deal_proteins (
    id bigserial primary key,
    bundle_variant text not null references public.bundle_deals(variant) on delete cascade,
    protein_id text not null references public.ingredients(id) on delete cascade,
    display_order integer not null default 0,
    created_at timestamptz not null default now(),
    unique (bundle_variant, protein_id)
);

alter table public.meal_items enable row level security;
alter table public.ingredients enable row level security;
alter table public.bundle_deals enable row level security;
alter table public.bundle_deal_proteins enable row level security;

drop policy if exists "Public read meal_items" on public.meal_items;
create policy "Public read meal_items"
on public.meal_items for select
using (is_active = true);

drop policy if exists "Public read ingredients" on public.ingredients;
create policy "Public read ingredients"
on public.ingredients for select
using (is_active = true);

drop policy if exists "Public read bundle_deals" on public.bundle_deals;
create policy "Public read bundle_deals"
on public.bundle_deals for select
using (is_active = true);

drop policy if exists "Public read bundle_deal_proteins" on public.bundle_deal_proteins;
create policy "Public read bundle_deal_proteins"
on public.bundle_deal_proteins for select
using (true);
