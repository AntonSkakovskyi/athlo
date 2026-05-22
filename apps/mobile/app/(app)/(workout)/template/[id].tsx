import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { BottomSheet, TimePicker } from '@/components/ui';
import { useTemplateDetailScreen } from '@/features/workout/hooks/useTemplateDetailScreen';
import { ExerciseLogCard } from '@/features/workout/components';
import { TemplateDetailHeader } from '@/features/workout/components/TemplateDetailHeader/TemplateDetailHeader';
import { getTrackingType } from '@/utils/workout';
import { useAuth } from '@/contexts/AuthContext';

export default function TemplateDetailScreen() {
  const { user } = useAuth();
  const {
    typedTemplate, exercises, isLoading, error,
    editName, setEditName, editDesc, setEditDesc,
    isEditing, toggleEditing,
    handleSaveName, handleSaveDesc, handleDelete, handleStart,
    handleDeleteExercise, handleUpdateExercise, handleUpdateRestTime, handleSaveRestTime,
    timePickerVisible, setTimePickerVisible, pickerValue, setPickerValue,
    handleMoveExercise, handleAddExercise,
    handleUpdateSet, handleAddSet, handleDeleteSet,
    startFromTemplatePending, deleteTemplatePending,
    insets, router,
  } = useTemplateDetailScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isOwner = user?.id === typedTemplate?.creatorId;

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
        {isOwner && (
          <Pressable onPress={toggleEditing}>
            <Text style={styles.editBtn}>{isEditing ? 'Done' : 'Edit'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TemplateDetailHeader
          name={typedTemplate.name}
          description={typedTemplate.description}
          editName={editName}
          editDesc={editDesc}
          exerciseCount={exercises.length}
          onEditName={isOwner ? () => setEditName(typedTemplate.name) : () => {}}
          onEditDesc={isOwner ? () => setEditDesc(typedTemplate.description ?? '') : () => {}}
          onChangeEditName={setEditName}
          onChangeEditDesc={setEditDesc}
          onSaveName={handleSaveName}
          onSaveDesc={handleSaveDesc}
        />

        {exercises.length === 0 ? (
          <EmptyState title="No exercises yet" description="Add exercises to build your template" actionLabel={isOwner ? "+ Add Exercise" : undefined} onAction={isOwner ? handleAddExercise : undefined} />
        ) : (
          exercises.map((ex, idx) => (
            <ExerciseLogCard
              key={ex.id}
              exerciseName={ex.exercise?.name ?? `Exercise #${ex.order}`}
              trackingType={getTrackingType(ex.exercise?.trackingTypeId)}
              mode="template"
              isEditing={isEditing}
              sets={(ex.templateSets ?? []).sort((a, b) => a.order - b.order).map(s => ({ ...s, isCompleted: false }))}
              showNotes={false}
              restTime={ex.restTime}
              onUpdateSet={isOwner ? (setIdx, data) => { handleUpdateSet(ex.id, setIdx, data); } : () => {}}
              onAddSet={isOwner ? () => handleAddSet(ex.id) : undefined}
              onDeleteSet={isOwner ? (setIdx) => handleDeleteSet(ex.id, setIdx) : undefined}
              onRestTimer={isOwner ? () => handleUpdateRestTime(ex.id, ex.restTime ?? 0) : undefined}
              onDeleteExercise={isOwner ? () => handleDeleteExercise(ex.id) : undefined}
              onMoveUp={isOwner && idx > 0 ? () => handleMoveExercise(idx, 'up') : undefined}
              onMoveDown={isOwner && idx < exercises.length - 1 ? () => handleMoveExercise(idx, 'down') : undefined}
            />
          ))
        )}

        {exercises.length > 0 && isEditing && isOwner && (
          <Button title="+ Add Exercise" variant="ghost" onPress={handleAddExercise} style={styles.addExerciseBtn} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="▶ Start Workout" variant="primary" onPress={handleStart} isLoading={startFromTemplatePending} style={styles.footerButton} />
        {isOwner ? (
          <Button title="Delete" variant="danger" onPress={handleDelete} isLoading={deleteTemplatePending} style={styles.deleteButton} />
        ) : (
          <Button title="Save Template" variant="secondary" onPress={() => {}} style={styles.deleteButton} />
        )}
      </View>

      <BottomSheet
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        title="Rest Time"
        scrollable={false}
      >
        <TimePicker 
          value={pickerValue} 
          onChange={setPickerValue}
          hideHours={true}
        />
        <Button 
          title="Save Rest Time" 
          onPress={handleSaveRestTime} 
          style={styles.saveRestBtn}
        />
      </BottomSheet>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    header: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { fontSize: fontSize.md, color: c.primary, fontWeight: fontWeight.semibold },
    editBtn: { fontSize: fontSize.md, color: c.primary, fontWeight: fontWeight.semibold },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    addExerciseBtn: { marginTop: spacing.xs, marginBottom: spacing.lg },
    footer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
    footerButton: { flex: 1 },
    deleteButton: { width: 90 },
    errorText: { color: c.danger, fontSize: fontSize.lg },
    goBackBtn: { marginTop: spacing.lg },
    saveRestBtn: { marginTop: spacing.md, marginBottom: spacing.lg },
  });
}
