import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetMyMealPlans, useCreateMealPlan, useDeleteMealPlan, useActivateMealPlan } from '../../../hooks/api/useMealPlanHooks';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { IMealPlan } from '@athlo/shared';

export default function MealPlansScreen() {
  const router = useRouter();
  const { data: plans, isLoading } = useGetMyMealPlans();
  const createPlan = useCreateMealPlan();
  const deletePlan = useDeleteMealPlan();
  const activatePlan = useActivateMealPlan();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createPlan.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setShowCreate(false);
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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Meal Plans</Text>

      <Button title={showCreate ? 'Cancel' : '+ New Plan'} onPress={() => setShowCreate(!showCreate)} />

      {showCreate && (
        <View style={styles.card}>
          <Input label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Cutting Plan" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional" />
          <Button title="Create" onPress={handleCreate} />
        </View>
      )}

      {(plans as IMealPlan[])?.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planName} onPress={() => router.push(`/(app)/(nutrition)/meal-plan/${plan.id}` as never)}>
            {plan.name}
          </Text>
          {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
          <Text style={styles.planMeta}>{plan.totalDays} day(s)</Text>
          <View style={styles.actionRow}>
            <Button title="Activate" onPress={() => handleActivate(plan.id)} />
            <Text style={styles.deleteBtn} onPress={() => handleDelete(plan.id)}>Delete</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 8 },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  planName: { fontSize: 18, fontWeight: '600' },
  planDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  planMeta: { fontSize: 12, color: '#999', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  deleteBtn: { color: '#ff3b30', fontSize: 14, fontWeight: '500' },
});
