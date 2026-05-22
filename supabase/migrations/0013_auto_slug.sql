-- Auto-generate meals.slug from name so the admin never has to touch it.
-- On INSERT: always derive from name.
-- On UPDATE: only regenerate if name actually changed.
-- Collisions are resolved by appending -2, -3, etc.

CREATE OR REPLACE FUNCTION meals_set_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INT := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.name = OLD.name THEN
    RETURN NEW;
  END IF;

  base_slug := regexp_replace(
    regexp_replace(lower(trim(NEW.name)), '[^a-z0-9]+', '-', 'g'),
    '^-|-$', '', 'g'
  );
  candidate := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM meals
    WHERE slug = candidate
      AND (TG_OP = 'INSERT' OR id != NEW.id)
  ) LOOP
    counter   := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meals_auto_slug
  BEFORE INSERT OR UPDATE OF name
  ON meals
  FOR EACH ROW
  EXECUTE FUNCTION meals_set_slug();
