CREATE TABLE popular_dishes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id     UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  rank_order  INT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX idx_popular_dish_id ON popular_dishes (dish_id);
CREATE INDEX idx_popular_rank ON popular_dishes (rank_order) WHERE is_active = true;
