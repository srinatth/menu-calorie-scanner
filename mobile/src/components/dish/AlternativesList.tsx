import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Alternative } from '@menu-scanner/shared';
import { Card } from '../common/Card';
import { colors, spacing, typography } from '../../theme';

interface Props {
  currentDishName: string;
  alternatives: Alternative[];
  onSelect: (dishSlug: string) => void;
}

export function AlternativesList({ currentDishName, alternatives, onSelect }: Props) {
  if (alternatives.length === 0) return null;

  return (
    <Card>
      <Text style={typography.h3}>Healthier Alternatives</Text>
      <Text style={[typography.bodyMuted, styles.subtitle]}>Instead of {currentDishName}, try:</Text>

      <View style={styles.list}>
        {alternatives.map((alt) => (
          <Pressable key={alt.dish.id} onPress={() => onSelect(alt.dish.slug)} style={styles.row}>
            <View style={styles.textCol}>
              <Text style={typography.body}>{alt.dish.canonicalName}</Text>
              <Text style={typography.caption}>{alt.dish.nutrition.caloriesEstimate} kcal</Text>
            </View>
            <Text style={styles.savings}>-{alt.estimatedCaloriesSaved} kcal</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.md },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  textCol: { gap: 2 },
  savings: { color: colors.success, fontWeight: '700' },
});
