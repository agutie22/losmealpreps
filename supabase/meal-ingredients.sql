-- meal_ingredients: links a meal to its recipe ingredients (one per category)
create table if not exists public.meal_ingredients (
    id bigserial primary key,
    meal_id text not null references public.meal_items(id) on delete cascade,
    ingredient_id text not null references public.ingredients(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (meal_id, ingredient_id)
);

alter table public.meal_ingredients enable row level security;

-- Public can read (needed for the customizer to know what ingredients a meal uses)
drop policy if exists "Public read meal_ingredients" on public.meal_ingredients;
create policy "Public read meal_ingredients"
on public.meal_ingredients for select using (true);

-- Admin full access (same pattern as other tables — uses the admin allowlist RLS)
-- If you already have a generic admin policy, this will just add the select/insert/update/delete
-- for this new table. Otherwise, run admin-allowlist-email.sql after this.
