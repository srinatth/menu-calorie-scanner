import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, onSubmit, autoFocus }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Search for a dish, e.g. Paneer Butter Masala"
        placeholderTextColor={colors.textMuted}
        style={[typography.body, styles.input]}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  input: { height: 52 },
});
