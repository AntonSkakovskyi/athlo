import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { useStatisticsScreen } from '@/features/profile/hooks/useStatisticsScreen';
import { BodyMetricsTab } from '@/features/profile/components/BodyMetricsTab/BodyMetricsTab';

export default function StatisticsScreen() {
  const {
    insets,
    router,
  } = useStatisticsScreen();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
});
