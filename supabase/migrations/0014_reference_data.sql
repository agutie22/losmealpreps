-- Reference data that must exist on every environment (local + production).
-- Sample meals/ingredients live in seed.sql (local dev only).

insert into site_settings (key, value) values
  ('instagram_handle', 'losmealpreps'),
  ('contact_email',    'hello@losmealpreps.com'),
  ('hero_headline',    'Premium Meal Prep, Delivered'),
  ('tagline',          'Chef-made · Macro-tracked · Fresh, never frozen')
on conflict (key) do nothing;

insert into bundles (tier, display_name, tagline, slot_count, base_price_cents, per_slot_savings_cents, hero_image_url) values
  ('standard', 'Standard Bundle', 'Perfect for the work week', 5,  6500,  0,   null),
  ('premium',  'Premium Bundle',  'Fuel your entire week',    10, 12000, 100, null)
on conflict (tier) do nothing;

insert into dietary_tags (id, slug, label, short_label, color_token) values
  ('31000000-0000-0000-0000-000000000000', 'high-protein', 'High Protein',   'Protein',   'var(--color-tag-high-protein)'),
  ('32000000-0000-0000-0000-000000000000', 'keto',         'Keto Friendly',  'Keto',      'var(--color-tag-keto)'),
  ('33000000-0000-0000-0000-000000000000', 'low-carb',     'Low Carb',       'Low Carb',  'var(--color-tag-low-carb)'),
  ('34000000-0000-0000-0000-000000000000', 'veggie',       'Vegetarian',     'Veggie',    'var(--color-tag-veggie)'),
  ('35000000-0000-0000-0000-000000000000', 'cal-smart',    'Calorie Smart',  'Cal Smart', 'var(--color-tag-cal-smart)')
on conflict (id) do nothing;
