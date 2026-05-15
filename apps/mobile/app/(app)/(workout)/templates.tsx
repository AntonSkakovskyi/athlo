import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IWorkoutTemplate, IUserWorkoutTemplate } from '@athlo/shared';
import { colors, borderRadius, spacing } from '../../../constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { TemplateCard } from '../../../components/workout/TemplateCard';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useActiveWorkout } from '../../../contexts/ActiveWorkoutContext';
import {
  useGetMyTemplates,
  useInfinitePublicTemplates,
  useGetSavedTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useSaveTemplate,
  useUnsaveTemplate,
  useStartFromTemplate,
} from '../../../hooks/api/useTemplateHooks';

const TABS = ['My', 'Public', 'Saved'];

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [search, setSearch] = useState('');

  const { startWorkout, isActive } = useActiveWorkout();

  const myTemplates = useGetMyTemplates();
  const publicTemplatesQuery = useInfinitePublicTemplates(search.trim() || undefined);
  const savedTemplates = useGetSavedTemplates();

  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const saveTemplate = useSaveTemplate();
  const unsaveTemplate = useUnsaveTemplate();
  const startFromTemplate = useStartFromTemplate();

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    createTemplate.mutate(
      { name: newName.trim(), description: newDescription.trim() || undefined },
      {
        onSuccess: (template) => {
          setNewName('');
          setNewDescription('');
          setShowCreate(false);
          router.push(`/(app)/(workout)/template/${template.id}`);
        },
      },
    );
  }, [newName, newDescription, createTemplate, router]);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate.mutate(String(id)),
        },
      ]);
    },
    [deleteTemplate],
  );

  const handleStart = useCallback(
    (id: number) => {
      if (isActive) {
        Alert.alert('Active Workout', 'You already have an active workout. Finish it first.');
        return;
      }
      startFromTemplate.mutate(String(id), {
        onSuccess: (workout) => {
          if (workout) {
            startWorkout(workout, []);
            router.push('/(app)/(workout)/active-workout');
          }
        },
      });
    },
    [isActive, startFromTemplate, startWorkout, router],
  );

  const filterBySearch = useCallback(
    <T extends { name: string }>(items: T[]) => {
      if (!search.trim()) return items;
      const q = search.toLowerCase();
      return items.filter((t) => t.name.toLowerCase().includes(q));
    },
    [search],
  );

  const filteredMy = useMemo(
    () => filterBySearch(myTemplates.data ?? []),
    [myTemplates.data, filterBySearch],
  );

  const flatPublicTemplates = useMemo(
    () =>
      (publicTemplatesQuery.data?.pages ?? []).flatMap((p) => p.data) as (IWorkoutTemplate & {
        creatorNickname?: string;
      })[],
    [publicTemplatesQuery.data],
  );

  const filteredSaved = useMemo(() => {
    const items = savedTemplates.data ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (s) =>
        (s as IUserWorkoutTemplate & { workoutTemplate?: IWorkoutTemplate }).workoutTemplate?.name
          ?.toLowerCase()
          .includes(q) ?? false,
    );
  }, [savedTemplates.data, search]);

  const activeQuery = useMemo(() => {
    switch (activeTab) {
      case 0:
        return myTemplates;
      case 1:
        return publicTemplatesQuery;
      case 2:
        return savedTemplates;
      default:
        return myTemplates;
    }
  }, [activeTab, myTemplates, publicTemplatesQuery, savedTemplates]);

  const renderMyItem = ({ item }: { item: IWorkoutTemplate }) => (
    <TemplateCard
      name={item.name}
      description={item.description}
      variant="my"
      onPress={() => router.push(`/(app)/(workout)/template/${item.id}`)}
      onStart={() => handleStart(item.id)}
      onDelete={() => handleDelete(item.id)}
    />
  );

  const renderPublicItem = ({ item }: { item: IWorkoutTemplate & { creatorNickname?: string } }) => (
    <TemplateCard
      name={item.name}
      description={item.description}
      author={item.creatorNickname}
      variant="public"
      onStart={() => handleStart(item.id)}
      onSave={() => saveTemplate.mutate(String(item.id))}
    />
  );

  const renderSavedItem = ({ item }: { item: IUserWorkoutTemplate & { workoutTemplate?: IWorkoutTemplate & { creatorNickname?: string } } }) => (
    <TemplateCard
      name={item.workoutTemplate?.name ?? 'Template'}
      description={item.workoutTemplate?.description}
      author={item.workoutTemplate?.creatorNickname}
      variant="saved"
      onStart={() => handleStart(item.workoutTemplateId)}
      onUnsave={() => unsaveTemplate.mutate(String(item.workoutTemplateId))}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Templates</Text>
        <Pressable onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtn}>+ Create</Text>
        </Pressable>
      </View>

      {/* Segment Control */}
      <View style={styles.segmentWrap}>
        <SegmentControl segments={TABS} activeIndex={activeTab} onSelect={setActiveTab} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search templates..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Create Form */}
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

      {/* Template List */}
      {activeQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : activeQuery.error ? (
        <Text style={styles.errorText}>Failed to load templates</Text>
      ) : (
        <InfiniteList
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
