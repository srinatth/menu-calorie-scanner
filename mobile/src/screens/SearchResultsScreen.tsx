import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { SearchBar } from '../components/search/SearchBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useSearchDishes } from '../hooks/queries/useSearchDishes';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchResults'>;

export function SearchResultsScreen({ route, navigation }: Props) {
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const { data, isLoading } = useSearchDishes(query);
  const { addSearch } = useRecentSearches();

  useEffect(() => {
    if (data && query.trim()) {
      addSearch(query, data.results[0]?.dish ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <ScreenContainer>
      <SearchBar value={query} onChangeText={setQuery} autoFocus />

      <View style={styles.results}>
        {isLoading ? (
          <LoadingSpinner label="Searching…" />
        ) : !query.trim() ? (
          <EmptyState title="Search for a dish" message="Try 'Chicken Biryani' or 'Paneer Butter Masala'." />
        ) : data && data.results.length === 0 ? (
          <EmptyState
            title="We couldn't confidently identify this dish"
            message="Please try another spelling or choose from similar matches."
          />
        ) : (
          <FlatList
            data={data?.results ?? []}
            keyExtractor={(item) => item.dish.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate('DishDetail', { dishSlug: item.dish.slug })}
                style={styles.row}
              >
                <View>
                  <Text style={typography.body}>{item.dish.canonicalName}</Text>
                  <Text style={typography.caption}>{item.dish.cuisineRegion}</Text>
                </View>
                <Text style={typography.bodyMuted}>{item.dish.nutrition.caloriesEstimate} kcal</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  results: { flex: 1, marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
