create or replace function is_admin(user_email text)
returns boolean
language sql security definer as $$
  select user_email in (
    'admin@example.com',
    'hello@losmealpreps.com',
    'alex@losmealpreps.com'
  );
$$;

-- Enable RLS on all tables
alter table ingredients enable row level security;
alter table meals enable row level security;
alter table meal_default_ingredients enable row level security;
alter table meal_swap_options enable row level security;
alter table bundles enable row level security;
alter table dietary_tags enable row level security;
alter table meal_dietary_tags enable row level security;
alter table site_settings enable row level security;

-- Public read policies (is_active = true where applicable)
create policy "Public can view active ingredients" on ingredients for select using (is_active = true);
create policy "Public can view active meals" on meals for select using (is_active = true);
create policy "Public can view default ingredients for active meals" on meal_default_ingredients for select using (
  exists (select 1 from meals where meals.id = meal_default_ingredients.meal_id and meals.is_active = true)
);
create policy "Public can view swap options for active meals" on meal_swap_options for select using (
  exists (select 1 from meals where meals.id = meal_swap_options.meal_id and meals.is_active = true)
);
create policy "Public can view active bundles" on bundles for select using (is_active = true);
create policy "Public can view dietary tags" on dietary_tags for select using (true);
create policy "Public can view dietary tags for active meals" on meal_dietary_tags for select using (
  exists (select 1 from meals where meals.id = meal_dietary_tags.meal_id and meals.is_active = true)
);
create policy "Public can view site settings" on site_settings for select using (true);

-- Admin all access
create policy "Admins have full access to ingredients" on ingredients for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to meals" on meals for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to meal_default_ingredients" on meal_default_ingredients for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to meal_swap_options" on meal_swap_options for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to bundles" on bundles for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to dietary_tags" on dietary_tags for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to meal_dietary_tags" on meal_dietary_tags for all using (is_admin(auth.jwt()->>'email'));
create policy "Admins have full access to site_settings" on site_settings for all using (is_admin(auth.jwt()->>'email'));
