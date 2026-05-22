import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection/CollapsibleSection';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { PlanCard } from '@/features/nutrition/components';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useMealPlansScreen } from '@/features/nutrition/hooks/useMealPlansScreen';
import { useMemo } from 'react';
import type { IMealPlan } from '@athlo/shared';

const TABS = ['My', 'Public', 'Friends'];

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderPlan = (plan: IMealPlan, variant: 'my' | 'public' | 'saved') => (
    <PlanCard
      key={plan.id}
      plan={plan}
      variant={variant}
      isActive={plan.id === activePlanId}
      onOpen={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}
      onActivate={() => handleActivate(plan.id)}
      onDeactivate={handleDeactivate}
      onSave={variant === 'public' ? () => handleSave(plan.id) : undefined}
      onUnsave={variant === 'saved' ? () => handleUnsave(plan.id) : undefined}
      onDelete={variant === 'my' ? () => handleDelete(plan.id) : undefined}
    />
  );

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
                  {myGroups.owned.map(p => renderPlan(p, 'my'))}
                </CollapsibleSection>
              )}
              {myGroups.saved.length > 0 && (
                <CollapsibleSection title="Saved Plans" count={myGroups.saved.length} initiallyExpanded>
                  {myGroups.saved.map(p => renderPlan(p, 'saved'))}
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
          renderItem={({ item }) => renderPlan(item, 'public')}
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
                  {group.plans.map(p => renderPlan(p, 'public'))}
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
      <ScreenHeader
        title="Meal Plans"
        onBack={() => router.back()}
        rightAction={
          <Button
            title={showCreate ? 'Cancel' : '+ Create'}
            variant="ghost"
            onPress={() => setShowCreate(!showCreate)}
          />
        }
      />

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

          <VisibilitySelector value={visibility} onChange={setVisibility} />

          <Button title="Create" variant="primary" onPress={handleCreate} isLoading={isCreatePending} disabled={!name.trim()} style={styles.createBtn} />
        </View>
      )}

      {renderTabContent()}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    segmentWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    searchWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    searchInput: { marginBottom: 0 },
    createCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    createBtn: { marginTop: spacing.md },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    loader: { marginTop: 40 },
  });
}
