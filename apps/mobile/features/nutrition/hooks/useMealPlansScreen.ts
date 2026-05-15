import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useGetMyMealPlans,
  useCreateMealPlan,
  useDeleteMealPlan,
  useActivateMealPlan,
  useDeactivateMealPlan,
  useGetActiveMealPlan,
} from '@/features/nutrition/hooks';

export const VISIBILITY_LABELS: Record<number, string> = {
  1: '🔒 Private',
  2: '🌐 Public',
  3: '👥 Friends Only',
};

export function useMealPlansScreen() {
  const router = useRouter();
  const { data: plans, isLoading } = useGetMyMealPlans();
  const { data: activePlan } = useGetActiveMealPlan();
  const createPlan = useCreateMealPlan();
  const deletePlan = useDeleteMealPlan();
  const activatePlan = useActivateMealPlan();
  const deactivatePlan = useDeactivateMealPlan();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalDays, setTotalDays] = useState('7');

  const activePlanId = activePlan?.mealPlanId;

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    const list = [...plans];
    list.sort((a, b) => {
      if (a.id === activePlanId) return -1;
      if (b.id === activePlanId) return 1;
      return 0;
    });
    return list;
  }, [plans, activePlanId]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const days = parseInt(totalDays, 10);
    createPlan.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        totalDays: isNaN(days) || days < 1 ? 7 : days,
      },
      {
        onSuccess: (newPlan) => {
          setName('');
          setDescription('');
          setTotalDays('7');
          setShowCreate(false);
          router.push(`/(app)/(nutrition)/meal-plan/${newPlan.id}` as never);
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete meal plan?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan.mutate(String(id)) },
    ]);
  };

  const handleActivate = (id: number) => {
    activatePlan.mutate(String(id));
  };

  const handleDeactivate = () => {
    deactivatePlan.mutate();
  };

  return {
    plans,
    isLoading,
    activePlan,
    activePlanId,
    sortedPlans,
    showCreate,
    setShowCreate,
    name,
    setName,
    description,
    setDescription,
    totalDays,
    setTotalDays,
    handleCreate,
    handleDelete,
    handleActivate,
    handleDeactivate,
    isCreatePending: createPlan.isPending,
    router,
  };
}
