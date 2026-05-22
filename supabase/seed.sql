-- Local dev sample data only — never runs on production (db push skips this file).
-- Reference data (site_settings, bundles, dietary_tags) lives in 0014_reference_data.sql.

insert into ingredients (id, name, type, display_order, calories, protein_g, carbs_g, fat_g, upcharge_cents) values
  ('11000000-0000-0000-0000-000000000000', 'Grilled Chicken Breast', 'protein', 0, 165, 31,  0,    3.6, 0),
  ('12000000-0000-0000-0000-000000000000', 'Grass-fed Steak',        'protein', 1, 250, 26,  0,    15,  0),
  ('17000000-0000-0000-0000-000000000000', 'Salmon Filet',           'protein', 2, 280, 25,  0,    19,  0),
  ('13000000-0000-0000-0000-000000000000', 'Jasmine Rice',           'carb',    0, 205, 4.3, 44.5, 0.4, 0),
  ('14000000-0000-0000-0000-000000000000', 'Sweet Potato Mash',      'carb',    1, 180, 2,   41,   0.2, 0),
  ('18000000-0000-0000-0000-000000000000', 'Brown Rice',             'carb',    2, 215, 5,   45,   1.5, 0),
  ('15000000-0000-0000-0000-000000000000', 'Roasted Broccoli',       'veggie',  0, 55,  3.7, 11.2, 0.6, 0),
  ('16000000-0000-0000-0000-000000000000', 'Asparagus',              'veggie',  1, 20,  2.2, 3.7,  0.1, 0),
  ('19000000-0000-0000-0000-000000000000', 'Green Beans',            'veggie',  2, 30,  2,   7,    0.2, 0);

insert into ingredient_variants (id, ingredient_id, size_label, calories, protein_g, carbs_g, fat_g, price_cents, is_default, display_order) values
  ('41000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000000', '6 oz', 165, 31.0, 0.0, 3.6,  1000, true,  0),
  ('41000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000000', '8 oz', 220, 41.3, 0.0, 4.8,  1200, false, 1),
  ('42000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000000', '6 oz', 250, 26.0, 0.0, 15.0, 1300, true,  0),
  ('42000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000000', '8 oz', 333, 34.7, 0.0, 20.0, 1600, false, 1),
  ('43000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000000', '6 oz', 280, 25.0, 0.0, 19.0, 1300, true,  0),
  ('43000000-0000-0000-0000-000000000002', '17000000-0000-0000-0000-000000000000', '8 oz', 373, 33.3, 0.0, 25.3, 1600, false, 1);

insert into meals (id, slug, name, description, hero_image_url, base_price_cents, category, rating, rating_count, is_featured) values
  ('21000000-0000-0000-0000-000000000000', 'classic-chicken-rice', 'Classic Chicken & Rice',  'A staple for any fitness goal.',                                                               'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=800&q=80', 1250, 'Standard', 4.8, 124, true),
  ('22000000-0000-0000-0000-000000000000', 'steak-sweet-potato',   'Steak & Sweet Potato',    'Premium grass-fed steak cooked to perfection, paired with sweet potato mash and asparagus.', 'https://images.unsplash.com/photo-1544025162-811114bd4136?w=800&q=80', 1450, 'Premium',  4.9,  89, true),
  ('23000000-0000-0000-0000-000000000000', 'teriyaki-salmon',      'Teriyaki Salmon Bowl',    'Fresh roasted salmon glazed with teriyaki sauce, over brown rice and green beans.',          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', 1550, 'Premium',  4.7,  56, true);

insert into meal_default_ingredients (meal_id, ingredient_id) values
  ('21000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000'),
  ('21000000-0000-0000-0000-000000000000', '13000000-0000-0000-0000-000000000000'),
  ('21000000-0000-0000-0000-000000000000', '15000000-0000-0000-0000-000000000000'),
  ('22000000-0000-0000-0000-000000000000', '12000000-0000-0000-0000-000000000000'),
  ('22000000-0000-0000-0000-000000000000', '14000000-0000-0000-0000-000000000000'),
  ('22000000-0000-0000-0000-000000000000', '16000000-0000-0000-0000-000000000000'),
  ('23000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000000'),
  ('23000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000000'),
  ('23000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000000');

insert into meal_dietary_tags (meal_id, tag_id) values
  ('21000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000000'),
  ('22000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000000'),
  ('22000000-0000-0000-0000-000000000000', '33000000-0000-0000-0000-000000000000');
