import { useState, useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { confirmDestructive, showErrorAlert, showAlert } from '@/utils/alerts';
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
import { ICONS } from '@/utils/icons';
import { useToast } from '@/contexts/ToastContext';

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
  const [totalDays, setTotalDays] = useState('1');
  const [totalDaysError, setTotalDaysError] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<VisibilityType>(VisibilityType.PRIVATE);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [currentActivatingPlan, setCurrentActivatingPlan] = useState<{ id: number; name: string; totalDays: number } | null>(null);

  const activePlanId = activePlanQuery.data?.mealPlanId;

  const savedPlanIds = useMemo(() => {
    return new Set((savedPlansQuery.data ?? []).map(p => p.id));
  }, [savedPlansQuery.data]);

  // Grouping for "My" tab
  const myGroups = useMemo(() => {
    const owned = myPlansQuery.data ?? [];
    const saved = savedPlansQuery.data ?? [];
    
    const friendCreatorIds = new Set(
      (friendsPlansQuery.data ?? [])
        .map(p => p.creatorId)
        .filter((id): id is number => !!id),
    );

    const friendSaved = saved.filter(s => friendCreatorIds.has(s.creatorId));
    const publicGeneralSaved = saved.filter(s => !friendCreatorIds.has(s.creatorId));

    return {
      owned,
      friendSaved,
      publicGeneralSaved,
    };
  }, [myPlansQuery.data, savedPlansQuery.data, friendsPlansQuery.data]);

  const publicGroups = useMemo(() => {
    const plans = publicPlansQuery.data ?? [];
    return {
      general: plans.filter(p => !p.creatorId),
      public: plans.filter(p => !!p.creatorId),
    };
  }, [publicPlansQuery.data]);

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

    const parsedDays = parseInt(totalDays, 10);
    if (!totalDays.trim() || isNaN(parsedDays) || parsedDays < 1) {
      setTotalDaysError('Must be a whole number of at least 1');
      return;
    }
    setTotalDaysError(undefined);

    createPlan.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        totalDays: parsedDays,
        visibilityTypeId: VISIBILITY_ENUM_TO_ID[visibility],
      },
      {
        onSuccess: (newPlan) => {
          setName('');
          setDescription('');
          setTotalDays('1');
          setTotalDaysError(undefined);
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

  const handleActivate = (id: number, startDay?: number) => {
    activatePlan.mutate({ id: String(id), startDay });
  };

  const openActivationModal = (id: number, name: string, totalDays: number) => {
    if (totalDays === 0) {
      showAlert('Plan has no days', 'Add at least one day to this plan before activating it.');
      return;
    }
    setCurrentActivatingPlan({ id, name, totalDays });
    setShowActivationModal(true);
  };

  const { showToast } = useToast();

  const handleDeactivate = () => {
    deactivatePlan.mutate();
  };

  const handleSave = (id: number) => {
    savePlan.mutate(String(id), {
      onSuccess: () => {
        showToast({
          title: 'Plan Saved!',
          description: 'The meal plan has been added to your library. Go to the "My" tab to use it.',
          icon: ICONS.folder,
        });
      },
      onError: (err) => {
        showErrorAlert('Failed to save meal plan. Please try again.');
        console.error('Save plan error:', err);
      }
    });
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
    publicGroups,
    friendsGroups,
    showCreate,
    setShowCreate,
    name,
    setName,
    description,
    setDescription,
    totalDays,
    setTotalDays: (v: string) => { setTotalDays(v); setTotalDaysError(undefined); },
    totalDaysError,
    visibility,
    setVisibility,
    handleCreate,
    handleDelete,
    handleActivate,
    openActivationModal,
    showActivationModal,
    setShowActivationModal,
    currentActivatingPlan,
    handleDeactivate,
    handleSave,
    handleUnsave,
    isCreatePending: createPlan.isPending,
    router,
    savedPlanIds,
  };
}
