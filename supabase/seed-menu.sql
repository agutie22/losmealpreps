insert into public.meal_items (id, title, description, image, price, protein, carbs, fat, calories, is_active, display_order)
values
    ('1', 'Cowboy Butter Tri Tip Steak', 'Cowboy Butter Tri Tip Steak served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/C0DD97/FFFFFF?text=Cowboy+Butter+Tri+Tip+Steak', 16.00, 42, 50, 16, 526, true, 1),
    ('2', 'Ribeye Steak', 'Ribeye Steak served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/F0997B/FFFFFF?text=Ribeye+Steak', 18.00, 52, 50, 21, 615, true, 2),
    ('3', 'Garlic Butter Shrimp', 'Garlic Butter Shrimp served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/FAC775/FFFFFF?text=Garlic+Butter+Shrimp', 16.00, 41, 50, 4, 415, true, 3),
    ('4', 'Honey Glazed Salmon', 'Honey Glazed Salmon served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/5DCAA5/FFFFFF?text=Honey+Glazed+Salmon', 17.00, 38, 55, 18, 530, true, 4),
    ('5', 'Chipotle Style Chicken Breast', 'Chipotle Style Chicken Breast served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/C0DD97/FFFFFF?text=Chipotle+Style+Chicken+Breast', 14.00, 43, 50, 5, 430, true, 5),
    ('6', 'Marinated Chicken Thigh', 'Marinated Chicken Thigh served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/F0997B/FFFFFF?text=Marinated+Chicken+Thigh', 10.00, 39, 50, 8, 445, true, 6),
    ('7', 'Seasoned Ground Beef', 'Seasoned Ground Beef served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/FAC775/FFFFFF?text=Seasoned+Ground+Beef', 15.00, 52, 50, 17, 575, true, 7),
    ('8', 'Serrano Ground Turkey', 'Serrano Ground Turkey served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/5DCAA5/FFFFFF?text=Serrano+Ground+Turkey', 13.00, 44, 50, 16, 544, true, 8),
    ('9', 'Golden Lemon Tilapia', 'Golden Lemon Tilapia served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/C0DD97/FFFFFF?text=Golden+Lemon+Tilapia', 9.00, 50, 50, 5, 447, true, 9),
    ('10', 'Korean BBQ Bulgogi Beef', 'Korean BBQ Bulgogi Beef served with Cilantro Lime White Rice and Mixed Vegetables.', 'https://placehold.co/600x400/F0997B/FFFFFF?text=Korean+BBQ+Bulgogi+Beef', 13.00, 51, 70, 21, 675, true, 10)
on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    image = excluded.image,
    price = excluded.price,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    calories = excluded.calories,
    is_active = excluded.is_active,
    display_order = excluded.display_order,
    updated_at = now();

insert into public.ingredients (
    id, name, category, price, price_large,
    protein, carbs, fat, calories,
    protein_large, carbs_large, fat_large, calories_large,
    is_premium, is_active, display_order
)
values
    ('p1', 'Cowboy Butter Tri Tip Steak', 'protein', 16, 19, 36, 0, 15, 291, 48, 0, 21, 389, true, true, 1),
    ('p_ribeye', 'Ribeye Steak', 'protein', 18, 22, 46, 0, 20, 380, 61, 0, 27, 507, true, true, 2),
    ('p_shrimp', 'Garlic Butter Shrimp', 'protein', 16, 19, 35, 0, 3, 180, 46, 0, 4, 240, true, true, 3),
    ('p_salmon', 'Honey Glazed Salmon', 'protein', 17, 21, 32, 5, 17, 295, 43, 7, 23, 393, true, true, 4),
    ('p2', 'Chipotle Style Chicken Breast', 'protein', 14, 17, 37, 0, 4, 195, 50, 0, 6, 260, false, true, 5),
    ('p3', 'Marinated Chicken Thigh', 'protein', 10, 13, 33, 0, 7, 210, 44, 0, 9, 280, false, true, 6),
    ('p4', 'Seasoned Ground Beef', 'protein', 15, 18, 46, 0, 16, 340, 61, 0, 21, 453, true, true, 7),
    ('p5', 'Serrano Ground Turkey', 'protein', 13, 16, 38, 0, 15, 309, 51, 0, 19, 412, false, true, 8),
    ('p_tilapia', 'Golden Lemon Tilapia', 'protein', 9, 11, 44, 0, 4, 212, 58, 0, 5, 285, false, true, 9),
    ('p_bulgogi', 'Korean BBQ Bulgogi Beef', 'protein', 13, 15, 45, 20, 20, 440, 60, 27, 27, 587, true, true, 10),
    ('c1', 'Cilantro Lime White Rice', 'carb', 0, null, 4, 45, 1, 205, null, null, null, null, false, true, 11),
    ('c2', 'Seasoned Red Potatoes', 'carb', 0, null, 3, 30, 5, 180, null, null, null, null, false, true, 12),
    ('c3', 'No Carb', 'carb', 0, null, 0, 0, 0, 0, null, null, null, null, false, true, 13),
    ('v1', 'Mixed Vegetables', 'veggie', 0, null, 2, 5, 0, 30, null, null, null, null, false, true, 14),
    ('v2', 'No Veggies', 'veggie', 0, null, 0, 0, 0, 0, null, null, null, null, false, true, 15),
    ('s0', 'No Sauce', 'sauce', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false, true, 16),
    ('s1', 'Chimichurri', 'sauce', 2, 8, 0.5, 1, 10, 95, 2, 4, 40, 380, false, true, 17),
    ('s2', 'Red Salsa', 'sauce', 1.5, 6, 0, 2, 0, 10, 1, 8, 0, 40, false, true, 18)
on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    price = excluded.price,
    price_large = excluded.price_large,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    calories = excluded.calories,
    protein_large = excluded.protein_large,
    carbs_large = excluded.carbs_large,
    fat_large = excluded.fat_large,
    calories_large = excluded.calories_large,
    is_premium = excluded.is_premium,
    is_active = excluded.is_active,
    display_order = excluded.display_order,
    updated_at = now();

insert into public.bundle_deals (variant, title, subtitle, meal_count, price, image, is_active)
values
    ('standard', '10 MEAL BUNDLE DEAL', '10 MEALS (6OZ) ONLY $115', 10, 115, '', true),
    ('premium', 'PREMIUM BUNDLE DEAL', '10 MEALS (6OZ) ONLY $150', 10, 150, '', true)
on conflict (variant) do update set
    title = excluded.title,
    subtitle = excluded.subtitle,
    meal_count = excluded.meal_count,
    price = excluded.price,
    image = excluded.image,
    is_active = excluded.is_active,
    updated_at = now();

delete from public.bundle_deal_proteins
where bundle_variant in ('standard', 'premium');

insert into public.bundle_deal_proteins (bundle_variant, protein_id, display_order)
values
    ('standard', 'p2', 1),
    ('standard', 'p3', 2),
    ('standard', 'p5', 3),
    ('standard', 'p_tilapia', 4),
    ('premium', 'p1', 1),
    ('premium', 'p4', 2),
    ('premium', 'p_ribeye', 3),
    ('premium', 'p_shrimp', 4),
    ('premium', 'p_salmon', 5),
    ('premium', 'p_bulgogi', 6)
on conflict (bundle_variant, protein_id) do update set
    display_order = excluded.display_order;
