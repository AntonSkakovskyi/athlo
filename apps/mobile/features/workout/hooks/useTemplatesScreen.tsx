import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  useGetMyTemplates, 
  useGetPublicTemplates, 
  useGetFriendsTemplates, 
  useCreateTemplate, 
  useStartFromTemplate 
} from '@/hooks/api';
import type { IWorkoutTemplate } from '@athlo/shared';
import { VisibilityType } from '@athlo/shared';
import TemplateCard from '../components/TemplateCard/TemplateCard';

export function useTemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTemplate.mutate(
      { 
        name: newName.trim(), 
        description: newDescription.trim() || undefined,
        visibilityTypeId: visibility as unknown as number,
      },
      {
        onSuccess: (tpl: IWorkoutTemplate) => {
          setNewName('');
          setNewDescription('');
          setVisibility(VisibilityType.PRIVATE);
          setShowCreate(false);
          router.push(`/(app)/(workout)/template/${tpl.id}` as any);
        },
      }
    );
  };

  const handleStartFromTemplate = (id: number) => {
    startFromTemplate.mutate(String(id), {
      onSuccess: () => {
        router.replace('/(app)/(workout)/active-workout');
      },
    });
  };

  const renderTemplateItem = (item: IWorkoutTemplate, variant: 'my' | 'public' | 'saved', creatorNickname?: string) => (
    <View key={item.id} style={styles.templateItem}>
      <TemplateCard
        name={item.name}
        description={item.description}
        author={creatorNickname}
        variant={variant}
        onPress={() => router.push(`/(app)/(workout)/template/${item.id}` as any)}
        onStart={() => handleStartFromTemplate(item.id)}
      />
    </View>
  );

  const myGroups = useMemo(() => {
    const templates = (myTemplatesQuery.data as any) ?? [];
    return {
      my: templates,
      friends: [],
      public: []
    };
  }, [myTemplatesQuery.data]);

  const publicGroups = useMemo(() => {
    const templates = (publicTemplatesQuery.data as any) ?? [];
    return {
      general: templates.filter((t: any) => !t.creatorId),
      public: templates.filter((t: any) => t.creatorId)
    };
  }, [publicTemplatesQuery.data]);

  const friendsGroups = useMemo(() => {
    const templates = (friendsTemplatesQuery.data as any) ?? [];
    // Group by friend
    const groups: Record<number, { friend: { id: number; nickname?: string; fullName: string }; templates: IWorkoutTemplate[] }> = {};
    templates.forEach((t: any) => {
      if (t.creatorId && t.creatorNickname) {
        if (!groups[t.creatorId]) {
          groups[t.creatorId] = { 
            friend: { id: t.creatorId, nickname: t.creatorNickname, fullName: t.creatorNickname },
            templates: [] 
          };
        }
        groups[t.creatorId].templates.push(t);
      }
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
  };
}

const styles = StyleSheet.create({
  templateItem: {
    marginBottom: spacing.md,
  },
});
