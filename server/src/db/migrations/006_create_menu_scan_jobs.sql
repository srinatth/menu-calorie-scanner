CREATE TABLE menu_scan_jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type           TEXT NOT NULL CHECK (source_type IN ('camera','gallery_image','pdf','qr_url')),
  source_uri            TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','ocr_in_progress','ai_analysis_in_progress','completed','failed')),
  error_message         TEXT,
  raw_ocr_text          TEXT,
  detected_dish_count   INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX idx_scan_jobs_status ON menu_scan_jobs (status);
CREATE INDEX idx_scan_jobs_created ON menu_scan_jobs (created_at);
