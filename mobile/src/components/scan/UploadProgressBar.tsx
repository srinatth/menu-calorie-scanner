import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MenuScanJobStatus } from '@menu-scanner/shared';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { colors, spacing, typography } from '../../theme';

interface Props {
  status: MenuScanJobStatus;
}

const STATUS_LABELS: Record<MenuScanJobStatus, string> = {
  pending: 'Preparing your menu…',
  ocr_in_progress: 'Reading the menu text…',
  ai_analysis_in_progress: 'Identifying dishes…',
  completed: 'Done!',
  failed: 'Something went wrong.',
};

const STEPS: MenuScanJobStatus[] = ['pending', 'ocr_in_progress', 'ai_analysis_in_progress', 'completed'];

export function UploadProgressBar({ status }: Props) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <View style={styles.container}>
      <LoadingSpinner />
      <Text style={typography.h3}>{STATUS_LABELS[status]}</Text>
      <View style={styles.dots}>
        {STEPS.map((step, index) => (
          <View
            key={step}
            style={[styles.dot, index <= currentIndex && status !== 'failed' ? styles.dotActive : undefined]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md },
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
});
