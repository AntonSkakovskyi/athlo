import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen/LoadingScreen';
import { VisibilitySelector } from '@/components/ui/VisibilitySelector/VisibilitySelector';
import { ExerciseLogCard, DurationPicker } from '@/features/workout/components';
import { useWorkoutSummaryScreen } from '@/features/workout/hooks/useWorkoutSummaryScreen';
import { FeelingSection } from './workout-summary/components/FeelingSection/FeelingSection';
import { MetricsRow } from './workout-summary/components/MetricsRow/MetricsRow';
import { getTrackingType } from '@/utils/workout';
import { formatSeconds } from '@/utils/time';
import { VISIBILITY_ENUM_TO_ID, getVisibilityIcon } from '@/utils/visibility';
import { BottomSheet, AchievementToast } from '@/components/ui';
import { useState } from 'react';


export default function WorkoutSummaryScreen() {
  const {
    workout,
    isLoading,
    exercises,
    completedSets,
    totalVolume,
    duration,
    insets,
    router,
    nameInput,
    setNameInput,
    isSavingName,
    isEditing,
    toggleEditing,
    handleUpdateSet,
    handleToggleSetComplete,
    handleAddSet,
    handleDeleteSet,
    handleMoveSet,
    handleUpdateExercise,
    handleDeleteExercise,
    handleMoveExercise,
    handleChangeExercise,
    handleAddExercise,
    toggleNotes,
    showNotesMap,
    localRpe,
    setLocalRpe,
    localCalories,
    setLocalCalories,
    localFeeling,
    setLocalFeeling,
    localDuration,
    setLocalDuration,
    localVisibility,
    setLocalVisibility,
    localDescription,
    setLocalDescription,
    lastPerformances,
    newAchievement,
    setNewAchievement,
  } = useWorkoutSummaryScreen();

  const [durationPickerVisible, setDurationPickerVisible] = useState(false);
  const [tempDuration, setTempDuration] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);

  const [prAchievement, setPrAchievement] = useState<any>(null);
  const [prVisible, setPrVisible] = useState(false);

  if (isLoading) {
    return <LoadingScreen paddingTop={insets.top} />;
  }

  if (!workout) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Workout not found</Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} style={styles.goBackBtn} />
      </View>
    );
  }

  const handleOpenPR = (set: any, exerciseName: string, trackingType?: string) => {
    if (set.achievement) {
      setPrAchievement(set.achievement);
    } else {
      let recordDetails = '';
      if (trackingType === 'WEIGHT_AND_REPS') {
        if (set.weight != null && set.reps != null) {
          recordDetails = `${set.weight}kg × ${set.reps} reps`;
        } else if (set.weight != null) {
          recordDetails = `${set.weight}kg`;
        } else if (set.reps != null) {
          recordDetails = `${set.reps} reps`;
        }
      } else if (trackingType === 'REPS_ONLY') {
        if (set.reps != null) recordDetails = `${set.reps} reps`;
      } else if (trackingType === 'TIME_BASED') {
        const dur = set.duration ? formatSeconds(set.duration) : '';
        const dist = set.distance ? `${set.distance}m` : '';
        recordDetails = [dur, dist].filter(Boolean).join(' ');
      }

      setPrAchievement({
        name: 'Personal Record!',
        description: recordDetails
          ? `You've set a new personal record of ${recordDetails} for ${exerciseName}!`
          : `You've set a new personal record for ${exerciseName}!`,
      });
    }
    setPrVisible(true);
  };

  const handleToggleEditing = () => {
    if (isEditing) {
      setIsEditingName(false);
    }
    toggleEditing();
  };

  const currentDurationSeconds = (() => {
    const parts = localDuration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  })();

  const handleOpenDurationPicker = () => {
    setTempDuration(currentDurationSeconds);
    setDurationPickerVisible(true);
  };

  const handleConfirmDuration = () => {
    const h = Math.floor(tempDuration / 3600);
    const m = Math.floor((tempDuration % 3600) / 60);
    const s = tempDuration % 60;
    setLocalDuration(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    setDurationPickerVisible(false);
  };

  const displayDuration = (() => {
    if (!isEditing) return duration;
    const h = Math.floor(currentDurationSeconds / 3600);
    const m = Math.floor((currentDurationSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  })();

  const renderExercise = (ex: any, index: number) => {
    const trackingType = getTrackingType(ex.exercise?.trackingTypeId);
    let sets = [...(ex.sets ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    // Filter out incomplete sets if not editing
    if (!isEditing) {
      sets = sets.filter(s => s.isCompleted);
    }

    const lp = lastPerformances?.[ex.exerciseId];
    const prevSets = lp?.sets ?? [];

    const logSets = sets.map((s, i) => {
      const prevSet = prevSets[i];
      const previousInWorkout = i > 0 ? sets[i-1] : null;

      return {
        ...s,
        previousWeight: prevSet?.weight,
        previousReps: prevSet?.reps,
        previousDuration: prevSet?.duration,
        previousDistance: prevSet?.distance,
        // Placeholders from previous set in CURRENT workout
        placeholderWeight: previousInWorkout?.weight ?? previousInWorkout?.placeholderWeight ?? prevSet?.weight,
        placeholderReps: previousInWorkout?.reps ?? previousInWorkout?.placeholderReps ?? prevSet?.reps,
        placeholderDuration: previousInWorkout?.duration ?? previousInWorkout?.placeholderDuration ?? prevSet?.duration,
        placeholderDistance: previousInWorkout?.distance ?? previousInWorkout?.placeholderDistance ?? prevSet?.distance,
      };
    });

    const exName = ex.exercise?.name ?? `Exercise #${ex.order}`;

    return (
      <ExerciseLogCard
        key={ex.id}
        exerciseName={exName}
        trackingType={trackingType}
        mode="summary"
        isEditing={isEditing}
        sets={logSets}
        notes={ex.notes}
        restTime={ex.restTime}
        showNotes={showNotesMap[ex.id] ?? false}
        isFirst={index === 0}
        isLast={index === exercises.length - 1}
        onToggleNotes={() => toggleNotes(ex.id)}
        onNotesChange={(text) => handleUpdateExercise(ex.id, { notes: text })}
        onUpdateSet={(setIdx, data) => handleUpdateSet(ex.id, setIdx, data)}
        onToggleSetComplete={(setIdx) => handleToggleSetComplete(ex.id, setIdx)}
        onAddSet={() => handleAddSet(ex.id)}
        onDeleteSet={(setIdx) => handleDeleteSet(ex.id, setIdx)}
        onMoveSet={(setIdx, dir) => handleMoveSet(ex.id, setIdx, dir)}
        onDeleteExercise={() => handleDeleteExercise(ex.id)}
        onMoveUp={() => handleMoveExercise(ex.id, 'up')}
        onMoveDown={() => handleMoveExercise(ex.id, 'down')}
        onChangeExercise={() => handleChangeExercise(ex.id)}
        onPRPress={(setIdx) => handleOpenPR(logSets[setIdx], exName, trackingType)}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader
        title="Summary"
        onBack={() => router.back()}
        rightAction={
          <Pressable onPress={handleToggleEditing} style={styles.renameBtn}>
            <Text style={styles.renameBtnText}>{isEditing ? '✅ Done' : '✏️ Edit'}</Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? (
          isEditingName ? (
            <TextInput
              style={styles.workoutNameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onBlur={() => setIsEditingName(false)}
              onSubmitEditing={() => setIsEditingName(false)}
              placeholder="Workout Name"
            />
          ) : (
            <Pressable onPress={() => setIsEditingName(true)}>
              <Text style={styles.workoutName}>{nameInput || workout.name}</Text>
            </Pressable>
          )
        ) : (
          <Text style={styles.workoutName}>{workout.name}</Text>
        )}
        <Text style={styles.workoutDate}>
          {new Date(workout.started_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>

        <MetricsRow
          displayDuration={isEditing ? displayDuration : duration}
          totalVolume={totalVolume}
          exercisesCount={exercises.length}
          completedSets={completedSets}
          isEditing={isEditing}
          onOpenDurationPicker={handleOpenDurationPicker}
        />

        <BottomSheet
          visible={durationPickerVisible}
          onClose={() => setDurationPickerVisible(false)}
          title="Workout Duration"
          scrollable={false}
        >
          <View style={{ paddingBottom: 16 }}>
            <DurationPicker 
              value={tempDuration}
              onChange={setTempDuration}
            />
            <Button 
              title="Confirm" 
              onPress={handleConfirmDuration}
              style={{ marginTop: 24 }}
            />
          </View>
        </BottomSheet>

        <BottomSheet
          visible={prVisible}
          onClose={() => setPrVisible(false)}
          title={prAchievement?.name}
          scrollable={false}
        >
          <View style={styles.prContent}>
            <Text style={styles.trophyBigIcon}>🏆</Text>
            <Text style={styles.prDescription}>{prAchievement?.description}</Text>
            <Button 
              title="Awesome!" 
              onPress={() => setPrVisible(false)}
              style={{ marginTop: 24 }}
            />
          </View>
        </BottomSheet>

        <View style={styles.optionalMetrics}>
          {!isEditing && (
            <View style={styles.optionalItem}>
              <Text style={styles.optionalLabel}>Visibility</Text>
              <Text style={styles.optionalValue}>
                {getVisibilityIcon(VISIBILITY_ENUM_TO_ID[localVisibility])}
              </Text>
            </View>
          )}
          <View style={styles.optionalItem}>
            <Text style={styles.optionalLabel}>RPE</Text>
            {isEditing ? (
              <TextInput
                style={styles.metricInput}
                value={localRpe}
                onChangeText={setLocalRpe}
                keyboardType="numeric"
                placeholder="0-10"
              />
            ) : (
              <Text style={styles.optionalValue}>{workout.rpe ?? '—'}/10</Text>
            )}
          </View>
          <FeelingSection
            isEditing={isEditing}
            localFeeling={localFeeling}
            workoutFeelingScore={workout.feelingScore}
            onFeelingChange={setLocalFeeling}
          />
          <View style={styles.optionalItem}>
            <Text style={styles.optionalLabel}>Calories</Text>
            {isEditing ? (
              <TextInput
                style={styles.metricInput}
                value={localCalories}
                onChangeText={setLocalCalories}
                keyboardType="numeric"
                placeholder="kcal"
              />
            ) : (
              <Text style={styles.optionalValue}>{workout.calories ?? '—'} kcal</Text>
            )}
          </View>
        </View>

        {isEditing && (
          <View style={styles.visibilitySection}>
            <VisibilitySelector value={localVisibility} onChange={setLocalVisibility} />
          </View>
        )}

        {(isEditing || localDescription) && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={styles.descriptionInput}
                value={localDescription}
                onChangeText={setLocalDescription}
                placeholder="Workout notes..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            ) : (
              <Text style={styles.descriptionText}>{localDescription}</Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Exercises</Text>
        {exercises.map((ex, idx) => renderExercise(ex, idx))}

        {isEditing && (
          <Button
            title="+ Add Exercise"
            variant="ghost"
            onPress={handleAddExercise}
            style={styles.addExerciseBtn}
          />
        )}
      </ScrollView>

      <AchievementToast
        visible={!!newAchievement}
        title={newAchievement?.title || ''}
        description={newAchievement?.description}
        onClose={() => setNewAchievement(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  goBackBtn: {
    marginTop: 16,
  },
  renameBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  renameBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  workoutName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  workoutNameInput: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 0,
  },
  workoutDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: 20,
  },
  optionalMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionalItem: {
    alignItems: 'center',
    minWidth: 70,
    flex: 1,
  },
  optionalLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  optionalValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  metricInput: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  visibilitySection: {
    marginBottom: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  addExerciseBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  prContent: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  trophyBigIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  prDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

