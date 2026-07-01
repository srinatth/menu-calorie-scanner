import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NutritionEstimate } from '@menu-scanner/shared';
import { Card } from '../common/Card';
import { colors, spacing, typography } from '../../theme';

interface Props {
  nutrition: NutritionEstimate;
}

export function NutritionSummaryCard({ nutrition }: Props) {
  return (
    <Card>
      <Text style={typography.caption}>ESTIMATED CALORIES</Text>
      <Text style={styles.calories}>{nutrition.caloriesEstimate} kcal</Text>
      <Text style={[typography.bodyMuted, styles.range]}>
        Range {nutrition.caloriesMin}–{nutrition.caloriesMax} kcal
      </Text>

      <View style={styles.macroRow}>
        <MacroStat label="Protein" value={`${nutrition.proteinG} g`} />
        <MacroStat label="Carbs" value={`${nutrition.carbsG} g`} />
        <MacroStat label="Fat" value={`${nutrition.fatG} g`} />
        <MacroStat label="Fiber" value={`${nutrition.fiberG} g`} />
      </View>

      <View style={styles.footerRow}>
        <Text style={typography.bodyMuted}>Serving size: {nutrition.servingSizeDesc}</Text>
        <Text style={typography.bodyMuted}>Confidence: {nutrition.confidencePct}%</Text>
      </View>
    </Card>
  );
}

function MacroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroStat}>
      <Text style={typography.h3}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  calories: { fontSize: 34, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },
  range: { marginBottom: spacing.lg },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  macroStat: { alignItems: 'center' },
  footerRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.xs },
});
