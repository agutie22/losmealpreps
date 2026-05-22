-- Assign sequential display_order within each ingredient type, ordered by name.
-- Fixes existing rows that were all left at the default of 0.
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY type ORDER BY name) - 1)::int AS new_order
  FROM ingredients
)
UPDATE ingredients
SET display_order = ranked.new_order
FROM ranked
WHERE ingredients.id = ranked.id;

-- Same fix for ingredient_variants within each ingredient, ordered by price ascending.
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY ingredient_id ORDER BY price_cents) - 1)::int AS new_order
  FROM ingredient_variants
)
UPDATE ingredient_variants
SET display_order = ranked.new_order
FROM ranked
WHERE ingredient_variants.id = ranked.id;
