CREATE TABLE dish_synonyms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id       UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  synonym       TEXT NOT NULL,
  synonym_type  TEXT CHECK (synonym_type IN ('abbreviation','misspelling','regional_name','alt_name')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_synonyms_trgm ON dish_synonyms USING GIN (synonym gin_trgm_ops);
CREATE INDEX idx_synonyms_dish_id ON dish_synonyms (dish_id);
