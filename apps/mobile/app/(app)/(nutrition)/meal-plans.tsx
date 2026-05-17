import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button/Button';
import { Tag } from '@/components/ui/Tag/Tag';
import { Input } from '@/components/ui/Input/Input';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useMealPlansScreen, VISIBILITY_LABELS } from '@/features/nutrition/hooks/useMealPlansScreen';
import { VisibilityType } from '@athlo/shared';

const VISIBILITY_OPTIONS = [
  { value: VisibilityType.PUBLIC, label: 'Public', icon: '🌍' },
  { value: VisibilityType.FRIENDS_ONLY, label: 'Friends', icon: '👥' },
  { value: VisibilityType.PRIVATE, label: 'Private', icon: '🔒' },
];

export default function MealPlansScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLoading, activePlanId, sortedPlans, showCreate, setShowCreate,
    name, setName, description, setDescription, totalDays, setTotalDays,
    visibility, setVisibility,
    handleCreate, handleDelete, handleActivate, handleDeactivate, isCreatePending, router,
  } = useMealPlansScreen();

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Meal Plans</Text>
        <Pressable onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.createHeaderBtn}>{showCreate ? 'Cancel' : '+ Create'}</Text>
        </Pressable>
      </View>

      {showCreate && (
        <View style={styles.createCard}>
          <Input label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Cutting Plan" />
          <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Describe your plan" />
          <Input label="Total Days" value={totalDays} onChangeText={setTotalDays} keyboardType="numeric" placeholder="7" />
          
          <Text style={styles.sectionLabel}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {VISIBILITY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.visibilityBtn, visibility === opt.value && styles.visibilityBtnActive]}
                onPress={() => setVisibility(opt.value)}
              >
                <Text style={styles.visibilityIcon}>{opt.icon}</Text>
                <Text style={[styles.visibilityLabel, visibility === opt.value && styles.visibilityLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button title="Create" variant="primary" onPress={handleCreate} isLoading={isCreatePending} disabled={!name.trim()} style={styles.createBtn} />
        </View>
      )}

      {activePlanId && sortedPlans.length > 0 && sortedPlans[0].id === activePlanId && (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerTop}>
            <Tag label="Active" color="primary" />
            <Button title="Deactivate" variant="danger" onPress={handleDeactivate} />
          </View>
          <Pressable onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${activePlanId}` as never)}>
            <Text style={styles.activePlanName}>{sortedPlans[0].name}</Text>
            {sortedPlans[0].description ? <Text style={styles.activePlanDesc} numberOfLines={2}>{sortedPlans[0].description}</Text> : null}
            <Text style={styles.activePlanMeta}>{sortedPlans[0].totalDays} day(s) · {VISIBILITY_LABELS[sortedPlans[0].visibilityTypeId] ?? '🔒 Private'}</Text>
          </Pressable>
        </View>
      )}

      {sortedPlans.length === 0 && !showCreate ? (
        <EmptyState title="No meal plans yet" description="Create your first plan to organize your nutrition" actionLabel="Create your first plan" onAction={() => setShowCreate(true)} />
      ) : (
        sortedPlans
          .filter((plan) => plan.id !== activePlanId)
          .map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <Pressable onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
                  <Text style={styles.visibilityBadge}>{VISIBILITY_LABELS[plan.visibilityTypeId] ?? '🔒'}</Text>
                </View>
                {plan.description ? <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text> : null}
                <Text style={styles.planMeta}>{plan.totalDays} day(s)</Text>
              </Pressable>
              <View style={styles.actionRow}>
                <Button title="Activate" variant="primary" onPress={() => handleActivate(plan.id)} style={styles.actionBtn} />
                <Button title="✏️" variant="ghost" onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)} style={styles.iconBtn} />
                <Button title="🗑️" variant="danger" onPress={() => handleDelete(plan.id)} style={styles.iconBtn} />
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  createHeaderBtn: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  createCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  createBtn: { marginTop: spacing.md },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  visibilityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visibilityBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  visibilityIcon: { fontSize: fontSize.md },
  visibilityLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  visibilityLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  activeBanner: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1.5, borderColor: colors.primary },
  activeBannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  activePlanName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  activePlanDesc: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  activePlanMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  planCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, flex: 1, marginRight: spacing.sm },
  visibilityBadge: { fontSize: fontSize.sm, color: colors.textMuted },
  planDesc: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  planMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm },
  iconBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
