import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface Props {
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ children, scroll = false, style }: PropsWithChildren<Props>) {
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Container
        style={scroll ? styles.scroll : [styles.content, style]}
        contentContainerStyle={scroll ? [styles.content, style] : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { flex: 1, padding: spacing.lg },
});
