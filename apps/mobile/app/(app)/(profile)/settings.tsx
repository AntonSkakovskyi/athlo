import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { SettingsRow } from '../../../features/profile/components/SettingsRow/SettingsRow';
import { useSettingsScreen } from '@/features/profile/hooks/useSettingsScreen';

export default function SettingsScreen() {
  const { insets, router, handleLogout, handleDeleteAccount } = useSettingsScreen();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => router.back()}>← Back</Text>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.card}>
          <SettingsRow label="Units" value="Metric" />
          <View style={styles.divider} />
          <SettingsRow label="Notifications" value="On" />
          <View style={styles.divider} />
          <SettingsRow label="Theme" value="Dark" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsRow label="Log Out" variant="danger" onPress={handleLogout} />
          <View style={styles.divider} />
          <SettingsRow label="Delete Account" variant="danger" onPress={handleDeleteAccount} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  backBtn: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.semibold },
  screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  headerSpacer: { width: 50 },
  section: { marginBottom: spacing['3xl'] },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
});
