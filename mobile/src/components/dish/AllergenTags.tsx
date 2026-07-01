import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Allergen } from '@menu-scanner/shared';
import { Card } from '../common/Card';
import { Chip } from '../common/Chip';
import { spacing, typography } from '../../theme';

interface Props {
  allergens: Allergen[];
}

const ALLERGEN_LABELS: Record<Allergen['type'], string> = {
  dairy: 'Dairy',
  gluten: 'Gluten',
  nuts: 'Nuts',
  soy: 'Soy',
  egg: 'Egg',
  shellfish: 'Shellfish',
};

export function AllergenTags({ allergens }: Props) {
  return (
    <Card>
      <Text style={typography.h3}>Common Allergens</Text>
      {allergens.length === 0 ? (
        <Text style={[typography.bodyMuted, styles.empty]}>No common allergens identified for this dish.</Text>
      ) : (
        <View style={styles.chips}>
          {allergens.map((allergen) => (
            <Chip
              key={allergen.type}
              label={`${ALLERGEN_LABELS[allergen.type]}${allergen.certainty === 'possible' ? ' (possible)' : ''}`}
              tone={allergen.certainty === 'definite' ? 'warning' : 'accent'}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  empty: { marginTop: spacing.sm },
});
