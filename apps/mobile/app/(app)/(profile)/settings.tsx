import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { SettingsRow } from '../../../features/profile/components/SettingsRow/SettingsRow';
import { useSettingsScreen } from '@/features/profile/hooks/useSettingsScreen';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useGetUserProfile, useUpdateUserProfile } from '@/hooks/api/useUserAPI';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { insets, router, handleLogout, handleDeleteAccount } = useSettingsScreen();
  const { user: authUser } = useAuth();
  const { data: user } = useGetUserProfile(authUser?.id ? String(authUser.id) : '');
  const updateProfile = useUpdateUserProfile();
  
  const [waterGoalModalVisible, setWaterGoalModalVisible] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState('');

  const [macrosModalVisible, setMacrosModalVisible] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [carbInput, setCarbInput] = useState('');

  useEffect(() => {
    if (user?.waterGoal) {
      setWaterGoalInput(String(user.waterGoal));
    }
  }, [user?.waterGoal, waterGoalModalVisible]);

  useEffect(() => {
    if (user) {
      setProteinInput(user.proteinGoal ? String(user.proteinGoal) : '');
      setFatInput(user.fatGoal ? String(user.fatGoal) : '');
      setCarbInput(user.carbGoal ? String(user.carbGoal) : '');
    }
  }, [user?.proteinGoal, user?.fatGoal, user?.carbGoal, macrosModalVisible]);

  const handleSaveWaterGoal = async () => {
    const parsed = parseInt(waterGoalInput, 10);
    const goalToSave = (isNaN(parsed) || parsed <= 0) ? null : parsed;
    await updateProfile.mutateAsync({ waterGoal: goalToSave });
    setWaterGoalModalVisible(false);
  };

  const handleSaveMacros = async () => {
    const p = parseInt(proteinInput, 10);
    const f = parseInt(fatInput, 10);
    const c = parseInt(carbInput, 10);
    await updateProfile.mutateAsync({
      proteinGoal: (isNaN(p) || p <= 0) ? null : p,
      fatGoal: (isNaN(f) || f <= 0) ? null : f,
      carbGoal: (isNaN(c) || c <= 0) ? null : c,
    });
    setMacrosModalVisible(false);
  };

  const currentCalorieGoal = useMemo(() => {
    if (!user?.proteinGoal && !user?.fatGoal && !user?.carbGoal) return null;
    return Math.round((user.proteinGoal ?? 0) * 4 + (user.fatGoal ?? 0) * 9 + (user.carbGoal ?? 0) * 4);
  }, [user]);

  const editingCalorieGoal = useMemo(() => {
    const p = parseInt(proteinInput, 10) || 0;
    const f = parseInt(fatInput, 10) || 0;
    const c = parseInt(carbInput, 10) || 0;
    if (!p && !f && !c) return null;
    return Math.round(p * 4 + f * 9 + c * 4);
  }, [proteinInput, fatInput, carbInput]);

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
            <SettingsRow 
              label="Water Goal" 
              value={user?.waterGoal ? `${user.waterGoal} ml` : 'Auto'} 
              onPress={() => setWaterGoalModalVisible(true)} 
            />
            <View style={styles.divider} />
            <SettingsRow 
              label="Nutrition Goals" 
              value={currentCalorieGoal ? `${currentCalorieGoal} kcal` : 'Not set'} 
              onPress={() => setMacrosModalVisible(true)} 
            />
            <View style={styles.divider} />
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

      {/* Water Goal Edit Modal */}
      <Modal visible={waterGoalModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setWaterGoalModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Water Goal (ml)</Text>
            <Text style={styles.modalDesc}>
              Leave empty or enter 0 to calculate automatically based on your body weight.
            </Text>
            <Input
              value={waterGoalInput}
              onChangeText={setWaterGoalInput}
              keyboardType="number-pad"
              placeholder="e.g. 2500"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setWaterGoalModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save" variant="primary" onPress={handleSaveWaterGoal} isLoading={updateProfile.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Nutrition Goals Edit Modal */}
      <Modal visible={macrosModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setMacrosModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual Nutrition Goals</Text>
            <Text style={styles.modalDesc}>
              These goals are used if you don't have an active meal plan. Clear all fields to use only the daily summary mode.
            </Text>
            
            <View style={{ marginBottom: spacing.md }}>
              <Input
                label="Protein (g)"
                value={proteinInput}
                onChangeText={setProteinInput}
                keyboardType="number-pad"
                placeholder="e.g. 150"
              />
              <Input
                label="Fats (g)"
                value={fatInput}
                onChangeText={setFatInput}
                keyboardType="number-pad"
                placeholder="e.g. 70"
              />
              <Input
                label="Carbs (g)"
                value={carbInput}
                onChangeText={setCarbInput}
                keyboardType="number-pad"
                placeholder="e.g. 250"
              />
            </View>

            <View style={styles.macroCalcRow}>
              <Text style={styles.macroCalcLabel}>Total Calories:</Text>
              <Text style={styles.macroCalcValue}>{editingCalorieGoal ? `${editingCalorieGoal} kcal` : '0 kcal'}</Text>
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setMacrosModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save" variant="primary" onPress={handleSaveMacros} isLoading={updateProfile.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  macroCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  macroCalcLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  macroCalcValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
