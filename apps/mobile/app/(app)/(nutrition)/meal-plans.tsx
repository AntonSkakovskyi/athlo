import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button/Button';
import { Tag } from '@/components/ui/Tag/Tag';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection/CollapsibleSection';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useMealPlansScreen, VISIBILITY_LABELS } from '@/features/nutrition/hooks/useMealPlansScreen';
import { VisibilityType, type IMealPlan } from '@athlo/shared';

const TABS = ['My', 'Public', 'Friends'];

const VISIBILITY_OPTIONS = [
  { value: VisibilityType.PUBLIC, label: 'Public', icon: '🌍' },
  { value: VisibilityType.FRIENDS_ONLY, label: 'Friends', icon: '👥' },
  { value: VisibilityType.PRIVATE, label: 'Private', icon: '🔒' },
];

export default function MealPlansScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLoading, activePlanId, activeTab, setActiveTab, search, setSearch,
    myGroups, publicPlans, friendsGroups,
    showCreate, setShowCreate,
    name, setName, description, setDescription, totalDays, setTotalDays,
    visibility, setVisibility,
    handleCreate, handleDelete, handleActivate, handleDeactivate,
    handleSave, handleUnsave, isCreatePending, router,
  } = useMealPlansScreen();

  const renderPlanItem = (plan: IMealPlan, variant: 'my' | 'public' | 'saved', creatorNickname?: string) => {
    const isActive = plan.id === activePlanId;
    const isOwned = variant === 'my';
    
    return (
      <View key={plan.id} style={[styles.planCard, isActive && styles.planCardActive]}>
        <Pressable onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
              {isActive && <Tag label="Active" color="primary"/>}
            </View>
            <Text style={styles.visibilityBadge}>
              {VISIBILITY_LABELS[plan.visibilityTypeId] ?? '🔒'}
            </Text>
          </View>
          
          {plan.description ? (
            <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
          ) : null}
          <Text style={styles.planMeta}>{plan.totalDays} day(s)</Text>
        </Pressable>

        <View style={styles.actionRow}>
          {!isActive && variant !== 'saved' && (
            <Button 
              title="Activate" 
              variant="primary" 
              onPress={() => handleActivate(plan.id)} 
              style={styles.actionBtn} 
            />
          )}
          {isActive && (
            <Button 
              title="Deactivate" 
              variant="danger" 
              onPress={handleDeactivate} 
              style={styles.actionBtn} 
            />
          )}
          
          {variant === 'public' && (
            <Button 
              title="Save" 
              variant="secondary" 
              onPress={() => handleSave(plan.id)} 
              style={styles.actionBtn} 
            />
          )}
          
          {variant === 'saved' && (
            <>
              {!isActive && (
                <Button 
                  title="Activate" 
                  variant="primary" 
                  onPress={() => handleActivate(plan.id)} 
                  style={styles.actionBtn} 
                />
              )}
              <Button 
                title="Unsave" 
                variant="ghost" 
                onPress={() => handleUnsave(plan.id)} 
                style={styles.actionBtn} 
              />
            </>
          )}

          {isOwned && (
            <>
              <Button title="🗑️" variant="danger" onPress={() => handleDelete(plan.id)} style={styles.iconBtn} />
            </>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (isLoading) {
      return <Spinner size="large" style={styles.loader} />;
    }

    if (activeTab === 0) {
      const hasContent = myGroups.owned.length > 0 || myGroups.saved.length > 0;
      if (!hasContent && !showCreate) {
        return (
          <EmptyState 
            title="No meal plans yet" 
            description="Create your first plan or save from public" 
            actionLabel="+ Create Plan"
            onAction={() => setShowCreate(true)}
          />
        );
      }

      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {myGroups.owned.length > 0 && (
                <CollapsibleSection title="My Plans" count={myGroups.owned.length} initiallyExpanded>
                  {myGroups.owned.map(p => renderPlanItem(p, 'my'))}
                </CollapsibleSection>
              )}
              {myGroups.saved.length > 0 && (
                <CollapsibleSection title="Saved Plans" count={myGroups.saved.length} initiallyExpanded>
                  {myGroups.saved.map(p => renderPlanItem(p, 'saved', (p as any).creatorNickname))}
                </CollapsibleSection>
              )}
            </View>
          }
          contentContainerStyle={styles.list}
        />
      );
    }

    if (activeTab === 1) {
      return (
        <InfiniteList
          data={publicPlans}
          renderItem={({ item }) => renderPlanItem(item, 'public', (item as any).creatorNickname)}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <EmptyState title="No public plans" description="Try searching for something else" />
          }
          contentContainerStyle={styles.list}
        />
      );
    }

    if (activeTab === 2) {
      if (friendsGroups.length === 0) {
        return (
          <EmptyState 
            title="No friend plans" 
            description="Your friends haven't shared any meal plans yet" 
          />
        );
      }

      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {friendsGroups.map(group => (
                <CollapsibleSection 
                  key={group.friend.id} 
                  title={group.friend.nickname || 'Friend'} 
                  count={group.plans.length}
                >
                  {group.plans.map(p => renderPlanItem(p, 'public', group.friend.nickname))}
                </CollapsibleSection>
              ))}
            </View>
          }
          contentContainerStyle={styles.list}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Meal Plans</Text>
        <Pressable onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.createHeaderBtn}>{showCreate ? 'Cancel' : '+ Create'}</Text>
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentControl segments={TABS} activeIndex={activeTab} onSelect={setActiveTab} />
      </View>

      {activeTab === 1 && (
        <View style={styles.searchWrap}>
          <Input 
            placeholder="Search public plans..." 
            value={search} 
            onChangeText={setSearch} 
            style={styles.searchInput}
          />
        </View>
      )}

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

      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  backBtn: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  createHeaderBtn: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  segmentWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchInput: { marginBottom: 0 },
  createCard: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  createBtn: { marginTop: spacing.md },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
  visibilityRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.xs },
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  loader: { marginTop: 40 },
  planCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  planCardActive: { borderColor: colors.primary, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  planName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, flexShrink: 1 },
  planAuthor: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium, marginBottom: 4 },
  visibilityBadge: { fontSize: fontSize.sm, color: colors.textMuted },
  planDesc: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  planMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm },
  iconBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
