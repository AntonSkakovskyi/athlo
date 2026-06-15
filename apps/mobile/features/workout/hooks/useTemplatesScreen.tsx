import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from '@/hooks/useRouter';
import { showAlert, showErrorAlert } from '@/utils/alerts';
import {
  useGetMyTemplates,
  useGetPublicTemplates,
  useGetFriendsTemplates,
  useCreateTemplate,
  useStartFromTemplate,
  useSaveTemplate,
  useUnsaveTemplate,
  useGetSavedTemplates,
} from '@/hooks/api';
import type { SaveTemplateInput } from '@/hooks/api';
import type { IWorkoutTemplate } from '@athlo/shared';
import { VisibilityType } from '@athlo/shared';
import { VISIBILITY_ENUM_TO_ID } from '@/utils/visibility';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import TemplateCard from '../components/TemplateCard/TemplateCard';

export function useTemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { startWorkout, isActive } = useActiveWorkout();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>(VisibilityType.PRIVATE);

  const myTemplatesQuery = useGetMyTemplates();
  const publicTemplatesQuery = useGetPublicTemplates();
  const friendsTemplatesQuery = useGetFriendsTemplates();

  const activeQuery = activeTab === 0 ? myTemplatesQuery : activeTab === 1 ? publicTemplatesQuery : friendsTemplatesQuery;

  const createTemplate = useCreateTemplate();
  const startFromTemplate = useStartFromTemplate();
  const saveTemplate = useSaveTemplate();
  const unsaveTemplate = useUnsaveTemplate();
  const savedTemplatesQuery = useGetSavedTemplates();
  const { showToast } = useToast();

  const handleCreate = () => {
    if (!newName.trim()) {
      showToast({ title: 'Template name is required', variant: 'error' });
      return;
    }
    createTemplate.mutate(
      { 
        name: newName.trim(), 
        description: newDescription.trim() || undefined,
        visibilityTypeId: VISIBILITY_ENUM_TO_ID[visibility],
      },
      {
        onSuccess: (tpl: IWorkoutTemplate) => {
          setNewName('');
          setNewDescription('');
          setVisibility(VisibilityType.PRIVATE);
          setShowCreate(false);
          router.push({ pathname: `/(app)/(workout)/template/${tpl.id}` as any, params: { edit: '1' } });
        },
      }
    );
  };

  const handleStartFromTemplate = (id: number) => {
    if (isActive) {
      showAlert('Active Workout', 'You already have an active workout. Finish it first.');
      return;
    }
    startFromTemplate.mutate(String(id), {
      onSuccess: (workout) => {
        if (workout) {
          startWorkout(workout, []);
          router.replace('/(app)/(workout)/active-workout');
        }
      },
      onError: () => {
        showErrorAlert('Failed to start workout. Please try again.');
      },
    });
  };

  const handleSave = (id: number, template: IWorkoutTemplate & { creatorNickname?: string }) => {
    const input: SaveTemplateInput = { id: String(id), template };
    saveTemplate.mutate(input, {
      onSuccess: () => {
        showToast({
          title: 'Template Saved!',
          description: 'The workout template has been added to your library. Go to the "My" tab to use it.',
          icon: '📁',
        });
      },
      onError: (err: unknown) => {
        const isAlreadySaved =
          (err as any)?.response?.data?.message === 'Template is already saved';
        if (!isAlreadySaved) {
          showErrorAlert('Failed to save template. Please try again.');
        }
        console.error('Save template error:', err);
      },
    });
  };

  const handleUnsave = (id: number) => {
    unsaveTemplate.mutate(String(id));
  };

  const savedTemplateIds = useMemo(() => {
    const saved = (savedTemplatesQuery.data ?? []) as Array<{ workoutTemplateId: number }>;
    return new Set(saved.map((s) => s.workoutTemplateId));
  }, [savedTemplatesQuery.data]);

  const isStartingTemplate = (id: number) =>
    startFromTemplate.isPending && startFromTemplate.variables === String(id);

  const renderTemplateItem = (
    item: IWorkoutTemplate,
    variant: 'my' | 'public' | 'saved',
    creatorNickname?: string,
    onSave?: () => void,
    onUnsave?: () => void,
  ) => (
    <View key={item.id} style={styles.templateItem}>
      <TemplateCard
        name={item.name}
        description={item.description}
        author={creatorNickname}
        variant={variant}
        onPress={() => router.push(`/(app)/(workout)/template/${item.id}` as any)}
        onStart={() => handleStartFromTemplate(item.id)}
        isStartingWorkout={isStartingTemplate(item.id)}
        onSave={onSave}
        onUnsave={onUnsave}
      />
    </View>
  );

  const myGroups = useMemo(() => {
    const myTemplates = (myTemplatesQuery.data ?? []) as IWorkoutTemplate[];
    const savedTemplates = (savedTemplatesQuery.data ?? []) as Array<{
      workoutTemplateId: number;
      workoutTemplate?: IWorkoutTemplate & { creatorNickname?: string };
    }>;

    const friendCreatorIds = new Set(
      ((friendsTemplatesQuery.data ?? []) as Array<{ creatorId?: number }>)
        .map(t => t.creatorId)
        .filter((id): id is number => !!id),
    );

    const friendSaved = savedTemplates.filter(
      s => s.workoutTemplate && friendCreatorIds.has(s.workoutTemplate.creatorId),
    );
    const publicGeneralSaved = savedTemplates.filter(
      s =>
        s.workoutTemplate &&
        !friendCreatorIds.has(s.workoutTemplate.creatorId) &&
        s.workoutTemplate.creatorId !== user?.id,
    );

    return {
      my: myTemplates,
      friends: friendSaved,
      public: publicGeneralSaved,
    };
  }, [myTemplatesQuery.data, savedTemplatesQuery.data, friendsTemplatesQuery.data, user?.id]);

  const publicGroups = useMemo(() => {
    const templates = (publicTemplatesQuery.data as any) ?? [];
    return {
      general: templates.filter((t: any) => !t.creatorId),
      public: templates.filter((t: any) => t.creatorId)
    };
  }, [publicTemplatesQuery.data]);

  const friendsGroups = useMemo(() => {
    const templates = (friendsTemplatesQuery.data as any) ?? [];
    const groups: Record<number, { friend: { id: number; nickname?: string; fullName: string }; templates: IWorkoutTemplate[] }> = {};
    templates.forEach((t: any) => {
      if (!t.creatorId) return;
      if (!groups[t.creatorId]) {
        const displayName: string = t.creatorNickname ?? `User ${t.creatorId}`;
        groups[t.creatorId] = {
          friend: { id: t.creatorId, nickname: t.creatorNickname ?? undefined, fullName: displayName },
          templates: [],
        };
      }
      groups[t.creatorId].templates.push(t);
    });
    return Object.values(groups);
  }, [friendsTemplatesQuery.data]);

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
    savedTemplateIds,
    handleSave,
    handleUnsave,
  };
}

const styles = StyleSheet.create({
  templateItem: {
    marginBottom: spacing.md,
  },
});
