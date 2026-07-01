import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dish } from '@menu-scanner/shared';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface Props {
  dishes: Dish[];
  onSelect: (dish: Dish) => void;
}

export function PopularDishesGrid({ dishes, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={typography.h3}>Popular Indian Dishes</Text>
      <View style={styles.grid}>
        {dishes.map((dish) => (
          <Pressable key={dish.id} onPress={() => onSelect(dish)} style={styles.tile}>
            <Text style={typography.body}>{dish.canonicalName}</Text>
            <Text style={typography.caption}>{dish.nutrition.caloriesEstimate} kcal</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  tile: {
    width: '47%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
