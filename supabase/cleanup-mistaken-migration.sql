-- Remove Los Meal Preps menu tables from a Supabase project by mistake.
-- ONLY run this in the WRONG / unused project (e.g. a project you linked by accident).
-- DO NOT run on your real production project if you already have live menu data you want to keep.
-- Safe to run if these four tables are ONLY from this app’s migration; verify in Table Editor first.

-- Order respects foreign keys: junction → bundles & ingredients, then standalone tables.
drop table if exists public.bundle_deal_proteins cascade;
drop table if exists public.bundle_deals cascade;
drop table if exists public.meal_items cascade;
drop table if exists public.ingredients cascade;
