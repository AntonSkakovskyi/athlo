import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useGetMyMealPlans,
  useCreateMealPlan,
  useDeleteMealPlan,
  useActivateMealPlan,
  useDeactivateMealPlan,
  useGetActiveMealPlan,
} from '../../../hooks/api/useMealPlanHooks';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { IMealPlan } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';

const VISIBILITY_LABELS: Record<number, string> = {
  1: '🔒 Private',
  2: '🌐 Public',
  3: '👥 Friends Only',
};

export default function MealPlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: plans, isLoading } = useGetMyMealPlans();
  const { data: activePlan } = useGetActiveMealPlan();
  const createPlan = useCreateMealPlan();
  const deletePlan = useDeleteMealPlan();
  const activatePlan = useActivateMealPlan();
  const deactivatePlan = useDeactivateMealPlan();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalDays, setTotalDays] = useState('7');

  const activePlanId = activePlan?.mealPlanId;

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    const list = [...(plans as IMealPlan[])];
    // Active plan first
    list.sort((a, b) => {
      if (a.id === activePlanId) return -1;
      if (b.id === activePlanId) return 1;
      return 0;
    });
    return list;
  }, [plans, activePlanId]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const days = parseInt(totalDays, 10);
    createPlan.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        totalDays: isNaN(days) || days < 1 ? 7 : days,
      },
      {
        onSuccess: (newPlan) => {
          setName('');
          setDescription('');
          setTotalDays('7');
          setShowCreate(false);
          router.push(`/(app)/(nutrition)/meal-plan/${newPlan.id}` as never);
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete meal plan?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan.mutate(String(id)) },
    ]);
  };

  const handleActivate = (id: number) => {
    activatePlan.mutate(String(id));
  };

  const handleDeactivate = () => {
    deactivatePlan.mutate();
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Meal Plans</Text>
        <Pressable onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.createHeaderBtn}>{showCreate ? 'Cancel' : '+ Create'}</Text>
        </Pressable>
      </View>

      {/* Create Form */}
      {showCreate && (
        <View style={styles.createCard}>
          <Input
            label="Plan Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cutting Plan"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your plan"
          />
          <Input
            label="Total Days"
            value={totalDays}
            onChangeText={setTotalDays}
            keyboardType="numeric"
            placeholder="7"
          />
          <Button
            title="Create"
            variant="primary"
            onPress={handleCreate}
            isLoading={createPlan.isPending}
            disabled={!name.trim()}
            style={styles.createBtn}
          />
        </View>
      )}

      {/* Active Plan Banner */}
      {activePlanId && sortedPlans.length > 0 && sortedPlans[0].id === activePlanId && (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerTop}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
            <Pressable onPress={handleDeactivate}>
              <Text style={styles.deactivateBtn}>Deactivate</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${activePlanId}` as never)}
          >
            <Text style={styles.activePlanName}>{sortedPlans[0].name}</Text>
            {sortedPlans[0].description ? (
              <Text style={styles.activePlanDesc} numberOfLines={2}>
                {sortedPlans[0].description}
              </Text>
            ) : null}
            <Text style={styles.activePlanMeta}>
              {sortedPlans[0].totalDays} day(s) · {VISIBILITY_LABELS[sortedPlans[0].visibilityTypeId] ?? '🔒 Private'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Plans List */}
      {sortedPlans.length === 0 && !showCreate ? (
        <EmptyState
          title="No meal plans yet"
          description="Create your first plan to organize your nutrition"
          actionLabel="Create your first plan"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        sortedPlans
          .filter((plan) => plan.id !== activePlanId)
          .map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <Pressable
                onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName} numberOfLines={1}>
                    {plan.name}
                  </Text>
                  <Text style={styles.visibilityBadge}>
                    {VISIBILITY_LABELS[plan.visibilityTypeId] ?? '🔒'}
                  </Text>
                </View>
                {plan.description ? (
                  <Text style={styles.planDesc} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}
                <Text style={styles.planMeta}>{plan.totalDays} day(s)</Text>
              </Pressable>

              <View style={styles.actionRow}>
                <Button
                  title="▶ Activate"
                  variant="secondary"
                  onPress={() => handleActivate(plan.id)}
                  style={styles.actionBtn}
                />
                <Button
                  title="✏️"
                  variant="ghost"
                  onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}
                  style={styles.iconBtn}
                />
                <Button
                  title="🗑️"
                  variant="danger"
                  onPress={() => handleDelete(plan.id)}
                  style={styles.iconBtn}
                />
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  createHeaderBtn: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Create form
  createCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBtn: {
    marginTop: 4,
  },

  // Active banner
  activeBanner: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  activeBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  deactivateBtn: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  activePlanName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  activePlanDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activePlanMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  // Plan cards
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  visibilityBadge: {
    fontSize: 12,
    color: colors.textMuted,
  },
  planDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  planMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
