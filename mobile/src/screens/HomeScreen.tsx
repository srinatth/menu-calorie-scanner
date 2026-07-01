import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { SearchBar } from '../components/search/SearchBar';
import { RecentSearchesList } from '../components/search/RecentSearchesList';
import { PopularDishesGrid } from '../components/search/PopularDishesGrid';
import { Button } from '../components/common/Button';
import { usePopularDishes } from '../hooks/queries/usePopularDishes';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { pickFromGallery } from '../utils/imagePicker';
import { pickPdfMenu } from '../utils/pdfPicker';
import { useUploadMenuScan } from '../hooks/queries/useUploadMenuScan';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const { data: popularDishes } = usePopularDishes();
  const { items: recentSearches, clear } = useRecentSearches();
  const uploadMutation = useUploadMenuScan();

  const goToSearch = () => {
    if (!query.trim()) return;
    navigation.navigate('SearchResults', { initialQuery: query.trim() });
  };

  const startUpload = async (picked: Awaited<ReturnType<typeof pickFromGallery>>, sourceType: 'gallery_image' | 'pdf') => {
    if (!picked) return;
    const { jobId } = await uploadMutation.mutateAsync({
      sourceType,
      fileUri: picked.uri,
      fileName: picked.name,
      mimeType: picked.mimeType,
    });
    navigation.navigate('MenuUploadReview', { jobId });
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Menu Calorie Scanner</Text>
      <Text style={[typography.bodyMuted, styles.subtitle]}>
        Estimate calories and nutrition for any Indian restaurant dish.
      </Text>

      <View style={styles.searchRow}>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={goToSearch} />
      </View>

      <View style={styles.actionsGrid}>
        <Button label="Scan Menu" onPress={() => navigation.navigate('MenuScan')} style={styles.actionButton} />
        <Button
          label="Upload Menu Image"
          variant="secondary"
          onPress={async () => startUpload(await pickFromGallery(), 'gallery_image')}
          style={styles.actionButton}
        />
        <Button
          label="Upload PDF Menu"
          variant="outline"
          onPress={async () => startUpload(await pickPdfMenu(), 'pdf')}
          style={styles.actionButton}
        />
        <Button
          label="Scan QR Menu"
          variant="outline"
          onPress={() => navigation.navigate('QRScan')}
          style={styles.actionButton}
        />
      </View>

      <RecentSearchesList
        items={recentSearches}
        onSelect={(item) => {
          if (item.dish) navigation.navigate('DishDetail', { dishSlug: item.dish.slug });
          else navigation.navigate('SearchResults', { initialQuery: item.query });
        }}
        onClear={clear}
      />

      <PopularDishesGrid
        dishes={popularDishes ?? []}
        onSelect={(dish) => navigation.navigate('DishDetail', { dishSlug: dish.slug })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  searchRow: { marginBottom: spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionButton: { flexGrow: 1, minWidth: '45%' },
});
