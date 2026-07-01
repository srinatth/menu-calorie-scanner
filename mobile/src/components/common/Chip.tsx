import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface Props {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
  style?: ViewStyle;
}

const TONE_COLORS: Record<NonNullable<Props['tone']>, { bg: string; text: string }> = {
  neutral: { bg: colors.border, text: colors.textPrimary },
  accent: { bg: '#FDF0DC', text: '#8A5A16' },
  success: { bg: '#E4F1E8', text: colors.success },
  warning: { bg: '#FBEAEA', text: colors.danger },
};

export function Chip({ label, tone = 'neutral', style }: Props) {
  const toneColor = TONE_COLORS[tone];
  return (
    <View style={[styles.chip, { backgroundColor: toneColor.bg }, style]}>
      <Text style={[typography.caption, { color: toneColor.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: borderRadius.chip,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
});
