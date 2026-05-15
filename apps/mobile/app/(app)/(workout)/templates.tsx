import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IWorkoutTemplate, IUserWorkoutTemplate } from '@athlo/shared';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useTemplatesScreen } from '@/features/workout/hooks/useTemplatesScreen';

const TABS = ['My', 'Public', 'Saved'];

export default function TemplatesScreen() {
  const {
    activeTab,
    setActiveTab,
    showCreate,
    setShowCreate,
    newName,
    setNewName,
    newDescription,
    setNewDescription,
    search,
    setSearch,
    filteredMy,
    flatPublicTemplates,
    filteredSaved,
    activeQuery,
    createTemplate,
    publicTemplatesQuery,
    renderMyItem,
    renderPublicItem,
    renderSavedItem,
    handleCreate,
    insets,
    router,
  } = useTemplatesScreen();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Templates</Text>
        <Pressable onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtn}>+ Create</Text>
        </Pressable>
      </View>

      <View style={styles.segmentWrap}>
        <SegmentControl segments={TABS} activeIndex={activeTab} onSelect={setActiveTab} />
      </View>

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search templates..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {showCreate && (
        <View style={styles.createForm}>
          <Input label="Name" value={newName} onChangeText={setNewName} placeholder="Template name" />
          <Input
            label="Description"
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Optional description"
          />
          <View style={styles.createButtons}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setShowCreate(false)}
              style={styles.formButton}
            />
            <Button
              title="Create"
              variant="primary"
              onPress={handleCreate}
              isLoading={createTemplate.isPending}
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {activeQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : activeQuery.error ? (
        <Text style={styles.errorText}>Failed to load templates</Text>
      ) : (
        <InfiniteList<IWorkoutTemplate | IUserWorkoutTemplate>
          data={
            activeTab === 0
              ? (filteredMy as (IWorkoutTemplate | IUserWorkoutTemplate)[])
              : activeTab === 1
                ? (flatPublicTemplates as (IWorkoutTemplate | IUserWorkoutTemplate)[])
                : (filteredSaved as (IWorkoutTemplate | IUserWorkoutTemplate)[])
          }
          renderItem={
            activeTab === 0
              ? (renderMyItem as never)
              : activeTab === 1
                ? (renderPublicItem as never)
                : (renderSavedItem as never)
          }
          keyExtractor={(item) => String((item as { id: number }).id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          hasNextPage={activeTab === 1 ? publicTemplatesQuery.hasNextPage : false}
          isFetchingNextPage={activeTab === 1 ? publicTemplatesQuery.isFetchingNextPage : false}
          onLoadMore={() => activeTab === 1 && publicTemplatesQuery.fetchNextPage()}
          ListEmptyComponent={
            <EmptyState
              title={
                activeTab === 0
                  ? 'Create your first template'
                  : activeTab === 1
                    ? 'No public templates found'
                    : 'No saved templates'
              }
              description={
                activeTab === 0
                  ? 'Templates make it easy to repeat workouts'
                  : activeTab === 1
                    ? 'Try adjusting your search'
                    : 'Save templates from the public library'
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 16,
  },
  backBtn: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  createBtn: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  createForm: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  formButton: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  loader: { marginTop: 40 },
  errorText: {
    textAlign: 'center',
    color: colors.danger,
    marginTop: 40,
    fontSize: 16,
  },
});
