import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { confirmDestructive, showErrorAlert } from '@/utils/alerts';
import { VisibilityType, type IMealPlan } from '@athlo/shared';
import {
  useGetMyMealPlans,
  useCreateMealPlan,
  useDeleteMealPlan,
  useActivateMealPlan,
  useDeactivateMealPlan,
  useGetActiveMealPlan,
  useGetPublicMealPlans,
  useGetFriendsMealPlans,
  useGetSavedMealPlans,
  useSaveMealPlan,
  useUnsaveMealPlan,
} from '@/features/nutrition/hooks';
import { VISIBILITY_ENUM_TO_ID } from '@/utils/visibility';

export function useMealPlansScreen() {
  const router = useRouter();
  
  // Tabs
  const [activeTab, setActiveTab] = useState(0); // 0: My, 1: Public, 2: Friends
  const [search, setSearch] = useState('');

  // Queries
  const myPlansQuery = useGetMyMealPlans();
  const activePlanQuery = useGetActiveMealPlan();
  const publicPlansQuery = useGetPublicMealPlans(search);
  const friendsPlansQuery = useGetFriendsMealPlans();
  const savedPlansQuery = useGetSavedMealPlans();

  const activeQuery = activeTab === 0 ? myPlansQuery : activeTab === 1 ? publicPlansQuery : friendsPlansQuery;

  // Mutations
  const createPlan = useCreateMealPlan();
  const deletePlan = useDeleteMealPlan();
  const activatePlan = useActivateMealPlan();
  const deactivatePlan = useDeactivateMealPlan();
  const savePlan = useSaveMealPlan();
  const unsavePlan = useUnsaveMealPlan();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalDays, setTotalDays] = useState('7');
  const [visibility, setVisibility] = useState<VisibilityType>(VisibilityType.PRIVATE);

  const activePlanId = activePlanQuery.data?.mealPlanId;

  // Grouping for "My" tab
  const myGroups = useMemo(() => {
    const owned = myPlansQuery.data ?? [];
    const saved = savedPlansQuery.data ?? [];
    return {
      owned,
      saved,
    };
  }, [myPlansQuery.data, savedPlansQuery.data]);

  // Grouping for "Friends" tab
  const friendsGroups = useMemo(() => {
    const plans = friendsPlansQuery.data ?? [];
    const groups: Record<number, { friend: { id: number; nickname?: string }; plans: IMealPlan[] }> = {};
    
    plans.forEach(p => {
      const creatorId = p.creatorId;
      if (!groups[creatorId]) {
        groups[creatorId] = { 
          friend: { id: creatorId, nickname: (p as any).creatorNickname }, 
          plans: [] 
        };
      }
      groups[creatorId].plans.push(p);
    });
    
    return Object.values(groups);
  }, [friendsPlansQuery.data]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const days = parseInt(totalDays, 10);
    createPlan.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        totalDays: isNaN(days) || days < 1 ? 7 : days,
        visibilityTypeId: VISIBILITY_ENUM_TO_ID[visibility],
      },
      {
        onSuccess: (newPlan) => {
          setName('');
          setDescription('');
          setTotalDays('7');
          setVisibility(VisibilityType.PRIVATE);
          setShowCreate(false);
          router.push(`/(app)/(nutrition)/meal-plan/${newPlan.id}` as never);
        },
        onError: (err) => {
          showErrorAlert('Failed to create meal plan. Please try again.');
          console.error('Create plan error:', err);
        }
      },
    );
  };

  const handleDelete = (id: number) => {
    confirmDestructive('Delete meal plan?', 'This action cannot be undone.', () => deletePlan.mutate(String(id)));
  };

  const handleActivate = (id: number) => {
    activatePlan.mutate(String(id));
  };

  const handleDeactivate = () => {
    deactivatePlan.mutate();
  };

  const handleSave = (id: number) => {
    savePlan.mutate(String(id));
  };

  const handleUnsave = (id: number) => {
    unsavePlan.mutate(String(id));
  };

  return {
    isLoading: activeQuery.isLoading || activePlanQuery.isLoading || savedPlansQuery.isLoading,
    activePlan: activePlanQuery.data,
    activePlanId,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    myGroups,
    publicPlans: publicPlansQuery.data ?? [],
    friendsGroups,
    showCreate,
    setShowCreate,
    name,
    setName,
    description,
    setDescription,
    totalDays,
    setTotalDays,
    visibility,
    setVisibility,
    handleCreate,
    handleDelete,
    handleActivate,
    handleDeactivate,
    handleSave,
    handleUnsave,
    isCreatePending: createPlan.isPending,
    router,
  };
}
