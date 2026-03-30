import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetMealPlanById } from '../../../../hooks/api/useMealPlanHooks';

export default function MealPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan, isLoading } = useGetMealPlanById(id);

  if (isLoading || !plan) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{plan.name}</Text>
      {plan.description ? <Text style={styles.desc}>{plan.description}</Text> : null}
      <Text style={styles.meta}>{plan.totalDays} day(s)</Text>

      {(plan as any).days?.map((day: any) => (
        <View key={day.id} style={styles.dayCard}>
          <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
          {day.notes ? <Text style={styles.dayNotes}>{day.notes}</Text> : null}

          {day.meals?.map((meal: any) => (
            <View key={meal.id} style={styles.mealBlock}>
              <Text style={styles.mealTypeName}>{meal.mealType?.name || `Meal #${meal.order}`}</Text>
              {meal.timeSuggestion ? <Text style={styles.timeSugg}>{meal.timeSuggestion}</Text> : null}

              {meal.items?.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.food?.name}</Text>
                  <Text style={styles.itemAmount}>
                    {item.amount} {item.unit?.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}
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
  desc: { fontSize: 14, color: '#666', marginTop: 4 },
  meta: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 16 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  dayNotes: { fontSize: 13, color: '#666', marginBottom: 8 },
  mealBlock: { marginBottom: 12 },
  mealTypeName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  timeSugg: { fontSize: 12, color: '#999', marginBottom: 4 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  itemName: { fontSize: 14 },
  itemAmount: { fontSize: 14, color: '#666' },
});
