import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { ColorPalette } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { SettingsRow } from '../../../features/profile/components/SettingsRow/SettingsRow';
import { useSettingsScreen } from '@/features/profile/hooks/useSettingsScreen';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { insets, router, handleLogout, handleDeleteAccount, themeLabel, handleThemePicker } =
    useSettingsScreen();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
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
            <SettingsRow label="Theme" value={themeLabel} onPress={handleThemePicker} />
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
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing['2xl'],
    },
    backBtn: { fontSize: fontSize.lg, color: c.primary, fontWeight: fontWeight.semibold },
    screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    headerSpacer: { width: 50 },
    section: { marginBottom: spacing['3xl'] },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: c.border, marginLeft: spacing.lg },
  });
}
