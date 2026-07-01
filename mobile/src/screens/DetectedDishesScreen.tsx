import React from 'react';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { DetectedDishRow } from '../components/scan/DetectedDishRow';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useMenuScanJob } from '../hooks/queries/useMenuScanJob';

type Props = NativeStackScreenProps<RootStackParamList, 'DetectedDishes'>;

export function DetectedDishesScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { data: job, isLoading } = useMenuScanJob(jobId);

  if (isLoading || !job) {
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading detected dishes…" />
      </ScreenContainer>
    );
  }

  const detectedDishes = job.detectedDishes ?? [];

  return (
    <ScreenContainer>
      {detectedDishes.length === 0 ? (
        <EmptyState
          title="No dishes detected"
          message="We couldn't find any dishes on this menu. Try scanning again with better lighting."
        />
      ) : (
        <FlatList
          data={detectedDishes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DetectedDishRow
              detected={item}
              onPress={() => {
                if (item.matchedDish) navigation.navigate('DishDetail', { dishSlug: item.matchedDish.slug });
              }}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}
