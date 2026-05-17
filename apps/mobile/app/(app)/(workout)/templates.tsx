import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection/CollapsibleSection';
import { useTemplatesScreen } from '@/features/workout/hooks/useTemplatesScreen';
import { VisibilityType } from '@athlo/shared';

const TABS = ['My', 'Public', 'Friends'];

const VISIBILITY_OPTIONS = [
  { value: VisibilityType.PUBLIC, label: 'Public', icon: '🌍' },
  { value: VisibilityType.FRIENDS_ONLY, label: 'Friends', icon: '👥' },
  { value: VisibilityType.PRIVATE, label: 'Private', icon: '🔒' },
];

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
    visibility,
    setVisibility,
    myGroups,
    publicGroups,
    friendsGroups,
    activeQuery,
    createTemplate,
    publicTemplatesQuery,
    renderTemplateItem,
    handleCreate,
    insets,
    router,
  } = useTemplatesScreen();

  const renderTabContent = () => {
    if (activeQuery.isLoading && !publicTemplatesQuery.isFetchingNextPage) {
      return <Spinner size="large" style={styles.loader} />;
    }

    if (activeQuery.error) {
      return <Text style={styles.errorText}>Failed to load templates</Text>;
    }

    if (activeTab === 0) {
      const hasContent = myGroups.my.length > 0 || myGroups.friends.length > 0 || myGroups.public.length > 0;
      if (!hasContent) {
        return (
          <EmptyState
            title="No templates found"
            description="Create your first template or save from public"
          />
        );
      }

      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {myGroups.my.length > 0 && (
                <CollapsibleSection title="My Templates" count={myGroups.my.length} initiallyExpanded>
                  {myGroups.my.map(t => renderTemplateItem(t, 'my'))}
                </CollapsibleSection>
              )}
              {myGroups.friends.length > 0 && (
                <CollapsibleSection title="Friends' Templates" count={myGroups.friends.length}>
                  {myGroups.friends.map(s => renderTemplateItem(s.workoutTemplate!, 'saved', s.workoutTemplate?.creatorNickname))}
                </CollapsibleSection>
              )}
              {myGroups.public.length > 0 && (
                <CollapsibleSection title="Public & General" count={myGroups.public.length}>
                  {myGroups.public.map(s => renderTemplateItem(s.workoutTemplate!, 'saved', s.workoutTemplate?.creatorNickname))}
                </CollapsibleSection>
              )}
            </View>
          }
          contentContainerStyle={styles.list}
        />
      );
    }

    if (activeTab === 1) {
      const hasContent = publicGroups.general.length > 0 || publicGroups.public.length > 0;
      
      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {publicGroups.general.length > 0 && (
                <CollapsibleSection title="General" count={publicGroups.general.length} initiallyExpanded>
                  {publicGroups.general.map(t => renderTemplateItem(t, 'public'))}
                </CollapsibleSection>
              )}
              {publicGroups.public.length > 0 && (
                <CollapsibleSection title="Public Templates" count={publicGroups.public.length} initiallyExpanded>
                  {publicGroups.public.map(t => renderTemplateItem(t, 'public', t.creatorNickname))}
                </CollapsibleSection>
              )}
              {!hasContent && !publicTemplatesQuery.isFetchingNextPage && (
                <EmptyState
                  title="No public templates found"
                  description="Try adjusting your search"
                />
              )}
            </View>
          }
          contentContainerStyle={styles.list}
          hasNextPage={publicTemplatesQuery.hasNextPage}
          isFetchingNextPage={publicTemplatesQuery.isFetchingNextPage}
          onLoadMore={() => publicTemplatesQuery.fetchNextPage()}
        />
      );
    }

    if (activeTab === 2) {
      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              <Button
                title="+ Add Friend"
                variant="ghost"
                onPress={() => router.push({ pathname: '/(app)/(profile)/friends', params: { tab: 'find' } })}
                style={styles.addFriendBtn}
              />
              {friendsGroups.length === 0 && (
                <EmptyState
                  title="No friend templates"
                  description="Your friends haven't shared any templates yet"
                />
              )}
              {friendsGroups.map(group => (
                <CollapsibleSection 
                  key={group.friend.id} 
                  title={group.friend.nickname || group.friend.fullName} 
                  count={group.templates.length}
                >
                  {group.templates.map(t => renderTemplateItem(t, 'public', group.friend.nickname))}
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
            multiline
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="Optional description"
          />

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

      {renderTabContent()}
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
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
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
  visibilityBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  visibilityIcon: {
    fontSize: fontSize.md,
  },
  visibilityLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  visibilityLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
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
  addFriendBtn: {
    marginBottom: spacing.md,
  },
  errorText: {
    textAlign: 'center',
    color: colors.danger,
    marginTop: 40,
    fontSize: 16,
  },
});
