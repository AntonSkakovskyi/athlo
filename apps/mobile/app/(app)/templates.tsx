import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { IWorkoutTemplate } from '@athlo/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  useGetMyTemplates,
  useGetPublicTemplates,
  useGetSavedTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useSaveTemplate,
  useUnsaveTemplate,
  useStartFromTemplate,
} from '../../hooks/api/useTemplateHooks';

type Tab = 'my' | 'public' | 'saved';

export default function TemplatesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const myTemplates = useGetMyTemplates();
  const publicTemplates = useGetPublicTemplates();
  const savedTemplates = useGetSavedTemplates();

  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const saveTemplate = useSaveTemplate();
  const unsaveTemplate = useUnsaveTemplate();
  const startFromTemplate = useStartFromTemplate();

  const router = useRouter();

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTemplate.mutate(
      { name: newName.trim(), description: newDescription.trim() || undefined },
      {
        onSuccess: () => {
          setNewName('');
          setNewDescription('');
          setShowCreate(false);
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate.mutate(String(id)) },
    ]);
  };

  const handleStart = (id: number) => {
    startFromTemplate.mutate(String(id), {
      onSuccess: (workout) => {
        if (workout?.id) {
          Alert.alert('Success', 'Workout started from template!');
        }
      },
    });
  };

  const renderMyTemplate = ({ item }: { item: IWorkoutTemplate }) => (
    <View style={styles.card}>
      <Pressable style={styles.cardContent} onPress={() => router.push(`/(app)/template/${item.id}`)}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
      </Pressable>
      <View style={styles.cardActions}>
        <Button title="Start" variant="primary" onPress={() => handleStart(item.id)} style={styles.actionButton} />
        <Button title="Delete" variant="danger" onPress={() => handleDelete(item.id)} style={styles.actionButton} />
      </View>
    </View>
  );

  const renderPublicTemplate = ({ item }: { item: IWorkoutTemplate & { creatorNickname?: string } }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
        {item.creatorNickname ? <Text style={styles.creator}>by @{item.creatorNickname}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <Button title="Save" variant="secondary" onPress={() => saveTemplate.mutate(String(item.id))} style={styles.actionButton} />
        <Button title="Start" variant="primary" onPress={() => handleStart(item.id)} style={styles.actionButton} />
      </View>
    </View>
  );

  const renderSavedTemplate = ({ item }: { item: { id: number; workoutTemplateId: number; workoutTemplate: IWorkoutTemplate & { creatorNickname?: string } } }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.workoutTemplate.name}</Text>
        {item.workoutTemplate.description ? <Text style={styles.cardDescription}>{item.workoutTemplate.description}</Text> : null}
        {item.workoutTemplate.creatorNickname ? <Text style={styles.creator}>by @{item.workoutTemplate.creatorNickname}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <Button title="Unsave" variant="danger" onPress={() => unsaveTemplate.mutate(String(item.workoutTemplateId))} style={styles.actionButton} />
        <Button title="Start" variant="primary" onPress={() => handleStart(item.workoutTemplateId)} style={styles.actionButton} />
      </View>
    </View>
  );

  const getActiveData = () => {
    switch (activeTab) {
      case 'my': return myTemplates;
      case 'public': return publicTemplates;
      case 'saved': return savedTemplates;
    }
  };

  const activeQuery = getActiveData();

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['my', 'public', 'saved'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'my' ? 'My Templates' : tab === 'public' ? 'Public' : 'Saved'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'my' && (
        <View style={styles.createSection}>
          {showCreate ? (
            <View style={styles.createForm}>
              <Input label="Name" value={newName} onChangeText={setNewName} placeholder="Template name" />
              <Input label="Description" value={newDescription} onChangeText={setNewDescription} placeholder="Optional description" />
              <View style={styles.createButtons}>
                <Button title="Cancel" variant="secondary" onPress={() => setShowCreate(false)} style={styles.formButton} />
                <Button title="Create" variant="primary" onPress={handleCreate} isLoading={createTemplate.isPending} style={styles.formButton} />
              </View>
            </View>
          ) : (
            <Button title="+ New Template" variant="primary" onPress={() => setShowCreate(true)} />
          )}
        </View>
      )}

      {activeQuery.isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : activeQuery.error ? (
        <Text style={styles.errorText}>Failed to load templates</Text>
      ) : (
        <FlatList
          data={activeQuery.data as IWorkoutTemplate[]}
          renderItem={
            activeTab === 'my'
              ? renderMyTemplate
              : activeTab === 'public'
                ? renderPublicTemplate
                : (renderSavedTemplate as never)
          }
          keyExtractor={(item) => String((item as { id: number }).id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No templates found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#007AFF', fontWeight: '600' },
  createSection: { padding: 16 },
  createForm: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  createButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  formButton: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardContent: { marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  cardDescription: { fontSize: 14, color: '#666', marginTop: 4 },
  creator: { fontSize: 12, color: '#999', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  loader: { marginTop: 40 },
  errorText: { textAlign: 'center', color: '#FF3B30', marginTop: 40, fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
});
