import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IWorkoutTemplate, IUserWorkoutTemplate } from '@athlo/shared';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useCreateTemplate, useDeleteTemplate, useGetMyTemplates, useGetSavedTemplates, useInfinitePublicTemplates, useSaveTemplate, useStartFromTemplate, useUnsaveTemplate } from '@/hooks/api';
import TemplateCard from '@/features/workout/components/TemplateCard/TemplateCard';

type SavedTemplateItem = IUserWorkoutTemplate & {
  workoutTemplate?: IWorkoutTemplate & { creatorNickname?: string };
};

type PublicTemplateItem = IWorkoutTemplate & { creatorNickname?: string };

export function useTemplatesScreen() {
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
    () => (publicTemplatesQuery.data?.pages ?? []).flatMap((p) => p.data),
    [publicTemplatesQuery.data],
  );

  const filteredSaved = useMemo(() => {
    const items = savedTemplates.data ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (s) => s.workoutTemplate?.name?.toLowerCase().includes(q) ?? false,
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

  const renderMyItem = useCallback(
    ({ item }: { item: IWorkoutTemplate }) => (
      <TemplateCard
        name={item.name}
        description={item.description}
        variant="my"
        onPress={() => router.push(`/(app)/(workout)/template/${item.id}`)}
        onStart={() => handleStart(item.id)}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [router, handleStart, handleDelete],
  );

  const renderPublicItem = useCallback(
    ({ item }: { item: PublicTemplateItem }) => (
      <TemplateCard
        name={item.name}
        description={item.description}
        author={item.creatorNickname}
        variant="public"
        onStart={() => handleStart(item.id)}
        onSave={() => saveTemplate.mutate(String(item.id))}
      />
    ),
    [handleStart, saveTemplate],
  );

  const renderSavedItem = useCallback(
    ({ item }: { item: SavedTemplateItem }) => (
      <TemplateCard
        name={item.workoutTemplate?.name ?? 'Template'}
        description={item.workoutTemplate?.description}
        author={item.workoutTemplate?.creatorNickname}
        variant="saved"
        onStart={() => handleStart(item.workoutTemplateId)}
        onUnsave={() => unsaveTemplate.mutate(String(item.workoutTemplateId))}
      />
    ),
    [handleStart, unsaveTemplate],
  );

  return {
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
    myTemplates,
    publicTemplatesQuery,
    savedTemplates,
    filteredMy,
    flatPublicTemplates,
    filteredSaved,
    activeQuery,
    createTemplate,
    deleteTemplate,
    saveTemplate,
    unsaveTemplate,
    startFromTemplate,
    handleCreate,
    handleDelete,
    handleStart,
    renderMyItem,
    renderPublicItem,
    renderSavedItem,
    insets,
    router,
    startWorkout,
    isActive,
  };
}
