export interface DetectedDishCandidate {
  rawText: string;
  positionInMenu: number;
}

export interface MenuUnderstandingAdapter {
  detectDishNames(cleanedLines: string[]): Promise<DetectedDishCandidate[]>;
}
