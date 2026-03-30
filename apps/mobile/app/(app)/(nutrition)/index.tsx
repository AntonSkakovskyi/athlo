import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useGetDailySummary, useCreateLogMeal, useDeleteLogMeal, useAddWaterLog, useDeleteWaterLog } from '../../../hooks/api/useNutritionLogHooks';
import { useGetMealTypes } from '../../../hooks/api/useMealTypeQueries';
import { Button } from '../../../components/ui/Button';
import type { ILogMeal, IWaterLog } from '@athlo/shared';

export default function NutritionScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const { data: summary, isLoading } = useGetDailySummary(date);
  const { data: mealTypes } = useGetMealTypes();
  const createMeal = useCreateLogMeal();
  const deleteMeal = useDeleteLogMeal();
  const addWater = useAddWaterLog();
  const deleteWater = useDeleteWaterLog();

  const [waterAmount, setWaterAmount] = useState('250');
  const [selectedMealTypeId, setSelectedMealTypeId] = useState<number | null>(null);

  const handleAddMeal = () => {
    if (!selectedMealTypeId) return;
    const mealTypeName = mealTypes?.find((t) => t.id === selectedMealTypeId)?.name;
    createMeal.mutate({
      mealTypeId: selectedMealTypeId,
      name: mealTypeName,
    });
  };

  const handleDeleteMeal = (id: number) => {
    Alert.alert('Delete meal?', 'This will remove the meal and all its items.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal.mutate(String(id)) },
    ]);
  };

  const handleAddWater = () => {
    const ml = parseInt(waterAmount, 10);
    if (ml > 0) {
      addWater.mutate({ amountMl: ml });
    }
  };

  const handleDeleteWater = (id: number) => {
    deleteWater.mutate(String(id));
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
      <Text style={styles.title}>Nutrition</Text>
      <Text style={styles.date}>{date}</Text>

      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{summary.totalCalories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{summary.totalProteins}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{summary.totalFats}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{summary.totalCarbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
          </View>
          <Text style={styles.waterSummary}>💧 {summary.totalWaterMl} ml</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Meals</Text>
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {mealTypes?.map((t) => (
            <Text
              key={t.id}
              style={[styles.chip, selectedMealTypeId === t.id && styles.chipActive]}
              onPress={() => setSelectedMealTypeId(t.id)}
            >
              {t.name}
            </Text>
          ))}
        </ScrollView>
        <Button title="Add Meal" onPress={handleAddMeal} />
      </View>

      {(summary?.meals as ILogMeal[])?.map((meal) => (
        <View key={meal.id} style={styles.mealRow}>
          <View>
            <Text style={styles.mealName}>{meal.name || 'Meal'}</Text>
            <Text style={styles.mealTime}>
              {new Date(meal.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.deleteBtn} onPress={() => handleDeleteMeal(meal.id)}>✕</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Water</Text>
      <View style={styles.card}>
        <View style={styles.waterRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={waterAmount}
            onChangeText={setWaterAmount}
            keyboardType="number-pad"
            placeholder="ml"
          />
          <Button title="+ Water" onPress={handleAddWater} />
        </View>
      </View>

      {(summary?.waterLogs as IWaterLog[])?.map((log) => (
        <View key={log.id} style={styles.waterLogRow}>
          <Text>{log.amountMl} ml</Text>
          <Text style={styles.mealTime}>
            {new Date(log.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.deleteBtn} onPress={() => handleDeleteWater(log.id)}>✕</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  date: { fontSize: 14, color: '#666', marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: 'bold' },
  macroLabel: { fontSize: 12, color: '#666' },
  waterSummary: { marginTop: 12, fontSize: 16, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 16,
    marginRight: 8,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: '#007AFF', color: '#fff' },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  mealName: { fontSize: 16, fontWeight: '500' },
  mealTime: { fontSize: 12, color: '#999' },
  deleteBtn: { fontSize: 18, color: '#ff3b30', padding: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 8,
  },
  waterRow: { flexDirection: 'row', alignItems: 'center' },
  waterLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
});
