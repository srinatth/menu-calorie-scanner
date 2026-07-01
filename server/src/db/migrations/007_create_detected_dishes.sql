CREATE TABLE detected_dishes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                UUID NOT NULL REFERENCES menu_scan_jobs(id) ON DELETE CASCADE,
  raw_detected_text     TEXT NOT NULL,
  matched_dish_id       UUID REFERENCES dishes(id),
  match_confidence_pct  INT,
  position_in_menu      INT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detected_dishes_job ON detected_dishes (job_id);
CREATE INDEX idx_detected_dishes_matched ON detected_dishes (matched_dish_id);
