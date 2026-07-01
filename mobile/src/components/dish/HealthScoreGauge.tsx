import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HealthRating } from '@menu-scanner/shared';
import { Card } from '../common/Card';
import { colors, spacing, typography } from '../../theme';

interface Props {
  rating: HealthRating;
}

function colorForScore(score: number): string {
  if (score >= 7) return colors.success;
  if (score >= 4.5) return colors.accent;
  return colors.danger;
}

export function HealthScoreGauge({ rating }: Props) {
  return (
    <Card>
      <Text style={typography.h3}>Health Score</Text>
      <Text style={[styles.score, { color: colorForScore(rating.score) }]}>{rating.score.toFixed(1)} / 10</Text>
      <View style={styles.reasons}>
        {rating.reasons.map((reason) => (
          <Text key={reason} style={[typography.bodyMuted, styles.reason]}>
            • {reason}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  score: { fontSize: 30, fontWeight: '800', marginTop: spacing.xs, marginBottom: spacing.md },
  reasons: { gap: spacing.xs },
  reason: { lineHeight: 20 },
});
