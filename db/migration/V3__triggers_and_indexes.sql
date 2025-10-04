-- =====================
-- TRIGGERS to auto-update "updated_at" on UPDATE
-- =====================
CREATE TRIGGER trg_ingredient_updated
BEFORE UPDATE ON ingredient
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ingredient_alias_updated
BEFORE UPDATE ON ingredient_alias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_condition_updated
BEFORE UPDATE ON "condition"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_condition_alias_updated
BEFORE UPDATE ON condition_alias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_interaction_updated
BEFORE UPDATE ON interaction
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_source_updated
BEFORE UPDATE ON "source"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
