import { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { useStatisticsScreen } from '@/features/profile/hooks/useStatisticsScreen';
import { BodyMetricsTab } from '@/features/profile/components/BodyMetricsTab/BodyMetricsTab';

export default function StatisticsScreen() {
  const {
    insets,
    router,
  } = useStatisticsScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="Body Metrics" onBack={() => router.back()} />

      <BodyMetricsTab />
    </ScrollView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: spacing.lg,
    },
  });
}
