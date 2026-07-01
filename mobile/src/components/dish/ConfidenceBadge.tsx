import React from 'react';
import { EstimationDifficulty } from '@menu-scanner/shared';
import { Chip } from '../common/Chip';

interface Props {
  confidencePct: number;
  difficulty?: EstimationDifficulty;
}

function toneForConfidence(pct: number): 'success' | 'accent' | 'warning' {
  if (pct >= 75) return 'success';
  if (pct >= 45) return 'accent';
  return 'warning';
}

export function ConfidenceBadge({ confidencePct, difficulty }: Props) {
  const label = difficulty ? `${confidencePct}% confident · ${difficulty} estimate` : `${confidencePct}% confident`;
  return <Chip label={label} tone={toneForConfidence(confidencePct)} />;
}
