import { Dish } from './dish';

export type MenuScanSourceType = 'camera' | 'gallery_image' | 'pdf' | 'qr_url';

export type MenuScanJobStatus =
  | 'pending'
  | 'ocr_in_progress'
  | 'ai_analysis_in_progress'
  | 'completed'
  | 'failed';

export interface DetectedDish {
  id: string;
  rawDetectedText: string;
  matchedDish: Dish | null;
  matchConfidencePct: number | null;
  positionInMenu: number;
  unresolved: boolean;
  suggestions?: Dish[];
}

export interface MenuScanJob {
  jobId: string;
  status: MenuScanJobStatus;
  sourceType: MenuScanSourceType;
  detectedDishCount: number;
  detectedDishes?: DetectedDish[];
  errorMessage?: string | null;
  createdAt: string;
}
