-- Migration: add ingredient_ids to meal_items and updated_at triggers
-- Run once in Supabase SQL Editor if you already have the tables from a previous setup.

alter table public.meal_items
    add column if not exists ingredient_ids text[] not null default '{}';

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists meal_items_updated_at on public.meal_items;
create trigger meal_items_updated_at before update on public.meal_items
    for each row execute function public.set_updated_at();

drop trigger if exists ingredients_updated_at on public.ingredients;
create trigger ingredients_updated_at before update on public.ingredients
    for each row execute function public.set_updated_at();

drop trigger if exists bundle_deals_updated_at on public.bundle_deals;
create trigger bundle_deals_updated_at before update on public.bundle_deals
    for each row execute function public.set_updated_at();

-- Backfill ingredient_ids for the standard seed meals
update public.meal_items set ingredient_ids = '{p1,c1,v1}'     where id = '1';
update public.meal_items set ingredient_ids = '{p_ribeye,c1,v1}' where id = '2';
update public.meal_items set ingredient_ids = '{p_shrimp,c1,v1}' where id = '3';
update public.meal_items set ingredient_ids = '{p_salmon,c1,v1}' where id = '4';
update public.meal_items set ingredient_ids = '{p2,c1,v1}'     where id = '5';
update public.meal_items set ingredient_ids = '{p3,c1,v1}'     where id = '6';
update public.meal_items set ingredient_ids = '{p4,c1,v1}'     where id = '7';
update public.meal_items set ingredient_ids = '{p5,c1,v1}'     where id = '8';
update public.meal_items set ingredient_ids = '{p_tilapia,c1,v1}' where id = '9';
update public.meal_items set ingredient_ids = '{p_bulgogi,c1,v1}' where id = '10';
