-- Create a reusable ENUM type for polymorphic entity references
-- This ensures that only 'INGREDIENT' or 'CONDITION' values are allowed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_entity_type') THEN
    CREATE TYPE interaction_entity_type AS ENUM ('INGREDIENT', 'CONDITION');
  END IF;
END$$;

-- Create a trigger function that automatically updates the "updated_at" column
-- whenever a row is modified (before UPDATE)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW(); -- set updated_at to current timestamp
  RETURN NEW;
END$$;
