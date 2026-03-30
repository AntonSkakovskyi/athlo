import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useGetProfile, useUpdateProfile } from '../../../hooks/api/useProfileHooks';
import { useGetBodyMetrics, useGetMetricTypes, useCreateBodyMetric, useDeleteBodyMetric } from '../../../hooks/api/useBodyMetricHooks';
import { Button } from '../../../components/ui/Button';
import type { IBodyMetric } from '@athlo/shared';

export default function ProfileScreen() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: metricTypes } = useGetMetricTypes();
  const { data: bodyMetrics } = useGetBodyMetrics();
  const updateProfile = useUpdateProfile();
  const createMetric = useCreateBodyMetric();
  const deleteMetric = useDeleteBodyMetric();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');

  const [selectedMetricTypeId, setSelectedMetricTypeId] = useState<number | null>(null);
  const [metricValue, setMetricValue] = useState('');

  const handleEditProfile = () => {
    if (profile) {
      setFullName(profile.fullName);
      setNickname(profile.nickname);
      setEditMode(true);
    }
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { fullName, nickname },
      {
        onSuccess: () => setEditMode(false),
      },
    );
  };

  const handleAddMetric = () => {
    if (!selectedMetricTypeId || !metricValue) return;
    createMetric.mutate(
      { metricTypeId: selectedMetricTypeId, value: parseFloat(metricValue) },
      {
        onSuccess: () => setMetricValue(''),
      },
    );
  };

  const handleDeleteMetric = (id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMetric.mutate(String(id)) },
    ]);
  };

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Profile</Text>

      {editMode ? (
        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          <Text style={styles.label}>Nickname</Text>
          <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />
          <View style={styles.row}>
            <Button title="Save" onPress={handleSaveProfile} />
            <Button title="Cancel" variant="danger" onPress={() => setEditMode(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.profileName}>{profile?.fullName}</Text>
          <Text style={styles.profileInfo}>@{profile?.nickname}</Text>
          <Text style={styles.profileInfo}>{profile?.email}</Text>
          <Button title="Edit Profile" onPress={handleEditProfile} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Body Metrics</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Metric Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {metricTypes?.map((t) => (
            <Text
              key={t.id}
              style={[styles.chip, selectedMetricTypeId === t.id && styles.chipActive]}
              onPress={() => setSelectedMetricTypeId(t.id)}
            >
              {t.name}
            </Text>
          ))}
        </ScrollView>

        <Text style={styles.label}>Value</Text>
        <TextInput
          style={styles.input}
          value={metricValue}
          onChangeText={setMetricValue}
          keyboardType="decimal-pad"
          placeholder="Enter value"
        />
        <Button title="Add Metric" onPress={handleAddMetric} />
      </View>

      {bodyMetrics?.map((metric: IBodyMetric) => {
        const typeName = metricTypes?.find((t) => t.id === metric.metricTypeId)?.name ?? '';
        return (
          <View key={metric.id} style={styles.metricRow}>
            <View>
              <Text style={styles.metricType}>{typeName}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricDate}>
                {new Date(metric.recordedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.deleteBtn} onPress={() => handleDeleteMetric(metric.id)}>
              ✕
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 14, color: '#666', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  profileName: { fontSize: 22, fontWeight: 'bold' },
  profileInfo: { fontSize: 16, color: '#666', marginTop: 4 },
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  metricType: { fontSize: 14, color: '#666' },
  metricValue: { fontSize: 18, fontWeight: '600' },
  metricDate: { fontSize: 12, color: '#999' },
  deleteBtn: { fontSize: 18, color: '#ff3b30', padding: 8 },
});
