import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { colors, spacing, typography } from '../../theme';

interface Props {
  ingredients: string[];
  note: string;
}

export function IngredientsList({ ingredients, note }: Props) {
  return (
    <Card>
      <Text style={typography.h3}>Ingredients</Text>
      <View style={styles.list}>
        {ingredients.map((ingredient) => (
          <View key={ingredient} style={styles.row}>
            <View style={styles.bullet} />
            <Text style={typography.body}>{ingredient}</Text>
          </View>
        ))}
      </View>
      <Text style={[typography.caption, styles.note]}>{note}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  note: { marginTop: spacing.lg, fontStyle: 'italic' },
});
