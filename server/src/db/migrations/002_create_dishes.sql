CREATE TABLE dishes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name         TEXT NOT NULL,
  slug                   TEXT UNIQUE NOT NULL,
  cuisine_region         TEXT,
  category               TEXT,
  calories_min           INT,
  calories_max           INT,
  calories_estimate      INT,
  protein_g              NUMERIC(6,2),
  carbs_g                NUMERIC(6,2),
  fat_g                  NUMERIC(6,2),
  fiber_g                NUMERIC(6,2),
  serving_size_desc      TEXT,
  estimation_difficulty  TEXT CHECK (estimation_difficulty IN ('easy','medium','hard')),
  confidence_pct         INT,
  common_ingredients     TEXT[] NOT NULL DEFAULT '{}',
  ingredients_note       TEXT NOT NULL DEFAULT 'Actual ingredients vary by restaurant.',
  allergens              JSONB NOT NULL DEFAULT '[]',
  health_score           NUMERIC(3,1),
  health_score_reasons   TEXT[] NOT NULL DEFAULT '{}',
  is_seed_data           BOOLEAN NOT NULL DEFAULT true,
  source                 TEXT NOT NULL DEFAULT 'seed',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dishes_name_trgm ON dishes USING GIN (canonical_name gin_trgm_ops);
CREATE INDEX idx_dishes_category ON dishes (category);
CREATE INDEX idx_dishes_cuisine_region ON dishes (cuisine_region);
