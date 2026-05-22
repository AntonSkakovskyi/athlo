import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection/CollapsibleSection';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { useTemplatesScreen } from '@/features/workout/hooks/useTemplatesScreen';

const TABS = ['My', 'Public', 'Friends'];

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderTabContent = () => {
    if (activeQuery.isLoading && !(publicTemplatesQuery as any).isFetchingNextPage) {
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
                  {myGroups.my.map((t: any) => renderTemplateItem(t as any, 'my'))}
                </CollapsibleSection>
              )}
              {myGroups.friends.length > 0 && (
                <CollapsibleSection title="Friends' Templates" count={myGroups.friends.length}>
                  {myGroups.friends.map((s: any) => renderTemplateItem(s.workoutTemplate! as any, 'saved', s.workoutTemplate?.creatorNickname))}
                </CollapsibleSection>
              )}
              {myGroups.public.length > 0 && (
                <CollapsibleSection title="Public & General" count={myGroups.public.length}>
                  {myGroups.public.map((s: any) => renderTemplateItem(s.workoutTemplate! as any, 'saved', s.workoutTemplate?.creatorNickname))}
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
                  {publicGroups.general.map((t: any) => renderTemplateItem(t as any, 'public'))}
                </CollapsibleSection>
              )}
              {publicGroups.public.length > 0 && (
                <CollapsibleSection title="Public Templates" count={publicGroups.public.length} initiallyExpanded>
                  {publicGroups.public.map((t: any) => renderTemplateItem(t as any, 'public', t.creatorNickname))}
                </CollapsibleSection>
              )}
              {!hasContent && !(publicTemplatesQuery as any).isFetchingNextPage && (
                <EmptyState
                  title="No public templates found"
                  description="Try adjusting your search"
                />
              )}
            </View>
          }
          contentContainerStyle={styles.list}
          hasNextPage={(publicTemplatesQuery as any).hasNextPage}
          isFetchingNextPage={(publicTemplatesQuery as any).isFetchingNextPage}
          onLoadMore={() => (publicTemplatesQuery as any).fetchNextPage?.()}
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

          <VisibilitySelector value={visibility} onChange={setVisibility} />

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    backBtn: {
      fontSize: 15,
      color: c.primary,
      fontWeight: '600',
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    createBtn: {
      fontSize: 15,
      color: c.primary,
      fontWeight: '600',
    },
    segmentWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    searchInput: {
      marginBottom: 0,
    },
    createForm: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    createButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
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
      color: c.danger,
      marginTop: 40,
      fontSize: 16,
    },
  });
}
