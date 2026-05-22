ALTER TABLE meals ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Assign sequential display_order based on creation date
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (ORDER BY created_at) - 1)::int AS new_order
  FROM meals
)
UPDATE meals
SET display_order = ranked.new_order
FROM ranked
WHERE meals.id = ranked.id;
