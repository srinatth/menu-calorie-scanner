import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { NutritionSummaryCard } from '../components/dish/NutritionSummaryCard';
import { IngredientsList } from '../components/dish/IngredientsList';
import { AllergenTags } from '../components/dish/AllergenTags';
import { HealthScoreGauge } from '../components/dish/HealthScoreGauge';
import { AlternativesList } from '../components/dish/AlternativesList';
import { useDishDetail } from '../hooks/queries/useDishDetail';
import { spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DishDetail'>;

export function DishDetailScreen({ route, navigation }: Props) {
  const { dishSlug } = route.params;
  const { data: dish, isLoading, isError } = useDishDetail(dishSlug);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading dish details…" />
      </ScreenContainer>
    );
  }

  if (isError || !dish) {
    return (
      <ScreenContainer>
        <EmptyState title="Dish not found" message="We couldn't load details for this dish." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>{dish.canonicalName}</Text>
      {dish.cuisineRegion ? <Text style={[typography.bodyMuted, styles.region]}>{dish.cuisineRegion}</Text> : null}

      <View style={styles.section}>
        <NutritionSummaryCard nutrition={dish.nutrition} />
      </View>
      <View style={styles.section}>
        <IngredientsList ingredients={dish.commonIngredients} note={dish.ingredientsNote} />
      </View>
      <View style={styles.section}>
        <AllergenTags allergens={dish.allergens} />
      </View>
      <View style={styles.section}>
        <HealthScoreGauge rating={dish.healthRating} />
      </View>
      <View style={styles.section}>
        <AlternativesList
          currentDishName={dish.canonicalName}
          alternatives={dish.alternatives}
          onSelect={(slug) => navigation.push('DishDetail', { dishSlug: slug })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  region: { marginTop: spacing.xs },
  section: { marginTop: spacing.lg },
});
