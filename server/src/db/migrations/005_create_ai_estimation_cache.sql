CREATE TABLE ai_estimation_cache (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key           TEXT UNIQUE NOT NULL,
  dish_name_raw       TEXT NOT NULL,
  restaurant_context  TEXT,
  provider            TEXT NOT NULL,
  result_json         JSONB NOT NULL,
  confidence_pct      INT,
  hit_count           INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_cache_key ON ai_estimation_cache (cache_key);
CREATE INDEX idx_cache_expires ON ai_estimation_cache (expires_at) WHERE expires_at IS NOT NULL;
