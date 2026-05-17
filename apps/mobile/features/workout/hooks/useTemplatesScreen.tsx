import { useState, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGetWorkoutTemplates, useCreateWorkoutTemplate, useStartWorkoutFromTemplate } from '@/hooks/api';
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

  const myTemplatesQuery = useGetWorkoutTemplates({ 
    onlyMy: true,
    search: search.trim() || undefined 
  });
  const publicTemplatesQuery = useGetWorkoutTemplates({ 
    onlyPublic: true,
    search: search.trim() || undefined 
  });
  const friendsTemplatesQuery = useGetWorkoutTemplates({ 
    onlyFriends: true,
    search: search.trim() || undefined 
  });

  const activeQuery = activeTab === 0 ? myTemplatesQuery : activeTab === 1 ? publicTemplatesQuery : friendsTemplatesQuery;

  const createTemplate = useCreateWorkoutTemplate();
  const startFromTemplate = useStartWorkoutFromTemplate();

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTemplate.mutate(
      { 
        name: newName.trim(), 
        description: newDescription.trim() || undefined,
        visibilityTypeId: visibility,
      },
      {
        onSuccess: (tpl) => {
          setNewName('');
          setNewDescription('');
          setVisibility(VisibilityType.PRIVATE);
          setShowCreate(false);
          router.push(`/(app)/(workout)/template/${tpl.id}`);
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
    <View key={item.id} style={{ marginBottom: 12 }}>
      <TemplateCard
        name={item.name}
        description={item.description}
        creatorName={creatorNickname}
        variant={variant}
        onPress={() => router.push(`/(app)/(workout)/template/${item.id}`)}
        onStart={() => handleStartFromTemplate(item.id)}
      />
    </View>
  );

  const myGroups = useMemo(() => {
    const templates = myTemplatesQuery.data?.pages.flatMap(p => p.items) ?? [];
    return {
      my: templates.filter(t => t.isCreator),
      friends: templates.filter(t => !t.isCreator && t.visibilityTypeId === VisibilityType.FRIENDS_ONLY),
      public: templates.filter(t => !t.isCreator && t.visibilityTypeId === VisibilityType.PUBLIC)
    };
  }, [myTemplatesQuery.data]);

  const publicGroups = useMemo(() => {
    const templates = publicTemplatesQuery.data?.pages.flatMap(p => p.items) ?? [];
    return {
      general: templates.filter(t => !t.creatorId),
      public: templates.filter(t => t.creatorId)
    };
  }, [publicTemplatesQuery.data]);

  const friendsGroups = useMemo(() => {
    const templates = friendsTemplatesQuery.data?.pages.flatMap(p => p.items) ?? [];
    // Group by friend
    const groups: Record<number, { friend: { id: number; nickname?: string; fullName: string }; templates: IWorkoutTemplate[] }> = {};
    templates.forEach(t => {
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
