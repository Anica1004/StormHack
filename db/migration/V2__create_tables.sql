-- =====================
-- EVIDENCE_LEVEL
-- =====================
CREATE TABLE IF NOT EXISTS evidence_level (
  score  SMALLINT PRIMARY KEY,  -- 0..5
  label  TEXT NOT NULL
);

--default seed
INSERT INTO evidence_level(score,label) VALUES
  (5,'Guideline'),
  (4,'Strong (Systematic Review / RCT)'),
  (3,'Moderate (Observational)'),
  (2,'Limited (Expert Opinion)'),
  (1,'Minimal / Unspecified'),
  (0,'No Source')
ON CONFLICT (score) DO NOTHING;

-- =====================
-- Main entity: INGREDIENT
-- =====================
CREATE TABLE IF NOT EXISTS ingredient (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- auto-increment PK
  slug         TEXT    NOT NULL UNIQUE, 		-- unique slug identifier
  name         TEXT    NOT NULL,				 -- ingredient name
  category     TEXT, 							-- optional category
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- creation timestamp
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- last update timestamp
);

-- Alias table for INGREDIENT
-- Each alias must be unique per ingredient
CREATE TABLE IF NOT EXISTS ingredient_alias (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ingredient_id  BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE, -- FK to ingredient
  alias          TEXT   NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ingredient_alias UNIQUE (ingredient_id, alias) -- prevent duplicate aliases
);

-- =====================
-- Main entity: CONDITION
-- =====================
CREATE TABLE IF NOT EXISTS "condition" (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE, -- unique slug identifier
  name         TEXT    NOT NULL,		 -- condition name
  category     TEXT, 
  kind         TEXT, 					-- type/kind of condition
  duration     TEXT, 					-- optional duration info
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alias table for CONDITION
CREATE TABLE IF NOT EXISTS condition_alias (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  condition_id  BIGINT NOT NULL REFERENCES "condition"(id) ON DELETE CASCADE, -- FK to condition
  alias         TEXT   NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_condition_alias UNIQUE (condition_id, alias) -- prevent duplicate aliases
);

-- =====================
-- INTERACTION (polymorphic links between INGREDIENT and/or CONDITION)
-- =====================
CREATE TABLE IF NOT EXISTS interaction (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  a_type       interaction_entity_type NOT NULL,  -- type of entity (INGREDIENT or CONDITION)
  a_id         BIGINT NOT NULL, 				-- referenced entity id
  b_type       interaction_entity_type NOT NULL, -- type of entity (INGREDIENT or CONDITION)
  b_id         BIGINT NOT NULL, 				-- referenced entity id
  itype        TEXT, 							-- interaction type (optional label)
  rationale    TEXT,							 -- reasoning/description
  evidence	   SMALLINT NOT NULL DEFAULT 0 REFERENCES evidence_level(score), -- evidence level (0-5)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_interaction_evidence CHECK (evidence BETWEEN 0 AND 5)
);

-- =====================
-- SOURCE (bibliographic or external references)
-- =====================
CREATE TABLE IF NOT EXISTS source (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label        TEXT    NOT NULL, -- short label/title
  url          TEXT, 			-- reference URL
  publisher    TEXT,			 -- publisher/source
  year         INTEGER, 		 -- publication year
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_source_url UNIQUE (url), -- enforce unique URL
  CONSTRAINT chk_source_year CHECK (year IS NULL OR (year BETWEEN 1000 AND 9999))
);

-- =====================
-- INTERACTION_SOURCE (many-to-many link table between interactions and sources)
-- =====================
CREATE TABLE IF NOT EXISTS interaction_source (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  interaction_id  BIGINT NOT NULL REFERENCES interaction(id) ON DELETE CASCADE, -- FK to interaction
  source_id       BIGINT NOT NULL REFERENCES source(id) ON DELETE CASCADE, 		-- FK to source
  CONSTRAINT uq_interaction_source UNIQUE (interaction_id, source_id) 			-- no duplicate links
);
