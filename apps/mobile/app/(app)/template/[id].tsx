import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { useGetTemplateById, useDeleteTemplate, useStartFromTemplate } from '../../../hooks/api/useTemplateHooks';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: template, isLoading, error } = useGetTemplateById(id);
  const deleteTemplate = useDeleteTemplate();
  const startFromTemplate = useStartFromTemplate();

  const handleDelete = () => {
    Alert.alert('Delete Template', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTemplate.mutate(id, {
            onSuccess: () => router.back(),
          }),
      },
    ]);
  };

  const handleStart = () => {
    startFromTemplate.mutate(id, {
      onSuccess: () => {
        Alert.alert('Success', 'Workout started from template!');
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !template) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load template</Text>
      </View>
    );
  }

  const exercises = (template as { templateExercises?: Array<{ id: number; order: number; restTime?: number; templateSets?: Array<{ order: number; weight?: number; reps?: number }>; exercise?: { name: string } }> }).templateExercises ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{template.name}</Text>
        {template.description ? <Text style={styles.description}>{template.description}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{item.exercise?.name ?? `Exercise #${item.order}`}</Text>
              <Text style={styles.exerciseSets}>{item.templateSets?.length ?? 0} sets</Text>
            </View>
            {item.templateSets?.map((set, idx) => (
              <Text key={idx} style={styles.detail}>
                Set {set.order}: {(set.weight ?? 0) > 0 ? `${set.weight}kg` : ''} {(set.reps ?? 0) > 0 ? `× ${set.reps}` : ''}
              </Text>
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No exercises added yet</Text>}
      />

      <View style={styles.footer}>
        <Button title="Start Workout" variant="primary" onPress={handleStart} isLoading={startFromTemplate.isPending} style={styles.footerButton} />
        <Button title="Delete" variant="danger" onPress={handleDelete} isLoading={deleteTemplate.isPending} style={styles.footerButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  description: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, gap: 8 },
  exerciseCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '500', color: '#333', flex: 1 },
  exerciseSets: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  detail: { fontSize: 13, color: '#666', marginTop: 2 },
  notes: { fontSize: 13, color: '#999', marginTop: 4, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 14 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  footerButton: { flex: 1 },
  errorText: { color: '#FF3B30', fontSize: 16 },
});
