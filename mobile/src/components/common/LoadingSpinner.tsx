import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  label?: string;
}

export function LoadingSpinner({ label }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={[typography.bodyMuted, styles.label]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  label: { marginTop: spacing.md },
});
