import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecentSearchItem } from '../../storage/recentSearches';
import { colors, spacing, typography } from '../../theme';

interface Props {
  items: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
  onClear: () => void;
}

export function RecentSearchesList({ items, onSelect, onClear }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h3}>Recent Searches</Text>
        <Pressable onPress={onClear}>
          <Text style={[typography.caption, styles.clear]}>Clear</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable key={`${item.query}-${item.searchedAt}`} onPress={() => onSelect(item)} style={styles.row}>
            <Text style={typography.body}>{item.dish?.canonicalName ?? item.query}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clear: { color: colors.primary },
  list: { marginTop: spacing.md, gap: spacing.sm },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
