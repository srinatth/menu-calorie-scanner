import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DetectedDish } from '@menu-scanner/shared';
import { Chip } from '../common/Chip';
import { colors, spacing, typography } from '../../theme';

interface Props {
  detected: DetectedDish;
  onPress: () => void;
}

export function DetectedDishRow({ detected, onPress }: Props) {
  const label = detected.matchedDish?.canonicalName ?? detected.rawDetectedText;

  return (
    <Pressable onPress={onPress} style={styles.row} disabled={detected.unresolved}>
      <View style={styles.textCol}>
        <Text style={typography.body}>{label}</Text>
        {detected.matchedDish ? (
          <Text style={typography.caption}>{detected.matchedDish.nutrition.caloriesEstimate} kcal (estimated)</Text>
        ) : (
          <Text style={[typography.caption, styles.unresolvedCaption]}>
            We couldn't confidently identify this dish
          </Text>
        )}
      </View>
      {detected.unresolved ? <Chip label="Unresolved" tone="warning" /> : <Chip label="Matched" tone="success" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textCol: { gap: 2, flex: 1, marginRight: spacing.md },
  unresolvedCaption: { color: colors.danger },
});
