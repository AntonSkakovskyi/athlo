import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import type { TemplateExerciseWithRelations } from '@/features/workout/types';
import { useTemplateDetailScreen } from '@/features/workout/hooks/useTemplateDetailScreen';
import { TemplateExerciseList } from '@/features/workout/components/TemplateExerciseList/TemplateExerciseList';
import { TemplateDetailHeader } from '@/features/workout/components/TemplateDetailHeader/TemplateDetailHeader';

export default function TemplateDetailScreen() {
  const {
    typedTemplate, exercises, isLoading, error,
    editName, setEditName, editDesc, setEditDesc,
    handleSaveName, handleSaveDesc, handleDelete, handleStart,
    handleDeleteExercise, handleAddExercise,
    startFromTemplatePending, deleteTemplatePending,
    insets, router,
  } = useTemplateDetailScreen();

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Spinner size="large" />
      </View>
    );
  }

  if (error || !typedTemplate) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Failed to load template</Text>
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} style={styles.goBackBtn} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }: { item: TemplateExerciseWithRelations }) => (
          <TemplateExerciseList item={item} onDeleteExercise={handleDeleteExercise} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TemplateDetailHeader
            name={typedTemplate.name}
            description={typedTemplate.description}
            editName={editName}
            editDesc={editDesc}
            exerciseCount={exercises.length}
            onEditName={() => setEditName(typedTemplate.name)}
            onEditDesc={() => setEditDesc(typedTemplate.description ?? '')}
            onChangeEditName={setEditName}
            onChangeEditDesc={setEditDesc}
            onSaveName={handleSaveName}
            onSaveDesc={handleSaveDesc}
          />
        }
        ListEmptyComponent={
          <EmptyState title="No exercises yet" description="Add exercises to build your template" actionLabel="+ Add Exercise" onAction={handleAddExercise} />
        }
        ListFooterComponent={exercises.length > 0 ? <Button title="+ Add Exercise" variant="ghost" onPress={handleAddExercise} style={styles.addExerciseBtn} /> : null}
      />

      <View style={styles.footer}>
        <Button title="▶ Start Workout" variant="primary" onPress={handleStart} isLoading={startFromTemplatePending} style={styles.footerButton} />
        <Button title="Delete" variant="danger" onPress={handleDelete} isLoading={deleteTemplatePending} style={styles.deleteButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  backBtn: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  addExerciseBtn: { marginTop: spacing.xs, marginBottom: spacing.lg },
  footer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  footerButton: { flex: 1 },
  deleteButton: { width: 90 },
  errorText: { color: colors.danger, fontSize: fontSize.lg },
  goBackBtn: { marginTop: spacing.lg },
});
