import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { ExerciseListItem } from '@/features/workout/components';
import { trackingTypeIcon } from '@/utils/workout';
import { useExercisePickerScreen } from '@/features/workout/hooks/useExercisePickerScreen';
import { EquipmentFilter } from './exercise-picker/components/EquipmentFilter/EquipmentFilter';
import { ExercisePickerList } from './exercise-picker/components/ExercisePickerList/ExercisePickerList';

export default function ExercisePickerScreen() {
  const {
    search,
    setSearch,
    selectedMuscleId,
    selectedEquipmentId,
    selectedExercises,
    isAdding,
    exercisesQuery,
    musclesQuery,
    equipmentsQuery,
    exerciseList,
    hasFilters,
    toggleMuscle,
    toggleEquipment,
    toggleExercise,
    handleAdd,
    clearFilters,
    insets,
    router,
    isReplaceMode,
  } = useExercisePickerScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const selectedList = useMemo(() => Array.from(selectedExercises.values()), [selectedExercises]);

  const filteredCatalogList = useMemo(
    () => exerciseList.filter((ex) => !selectedExercises.has(ex.id)),
    [exerciseList, selectedExercises],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader
        title={isReplaceMode ? 'Replace Exercise' : 'Choose Exercise'}
        onBack={() => router.back()}
      />

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search exercises..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <EquipmentFilter
        selectedMuscleId={selectedMuscleId}
        selectedEquipmentId={selectedEquipmentId}
        muscles={musclesQuery.data ?? []}
        equipments={equipmentsQuery.data ?? []}
        onToggleMuscle={toggleMuscle}
        onToggleEquipment={toggleEquipment}
      />

      <ExercisePickerList
        data={filteredCatalogList}
        isLoading={exercisesQuery.isLoading}
        hasNextPage={exercisesQuery.hasNextPage}
        isFetchingNextPage={exercisesQuery.isFetchingNextPage}
        onLoadMore={() => exercisesQuery.fetchNextPage()}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        selectedExercises={selectedExercises}
        onToggleExercise={toggleExercise}
        onExerciseDetailPress={(item) => {
          router.push({
            pathname: '/(app)/(workout)/exercise-detail',
            params: {
              exerciseId: String(item.id),
              exerciseName: item.name,
              trackingType: item.trackingType?.name || '',
            },
          });
        }}
      />

      {selectedList.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>Selected ({selectedList.length})</Text>
          </View>
          <ScrollView
            style={styles.selectedScroll}
            contentContainerStyle={styles.selectedContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedList.map((item) => (
              <ExerciseListItem
                key={item.id}
                name={item.name}
                trackingIcon={trackingTypeIcon(item.trackingTypeId)}
                equipment={item.equipment?.name}
                selected={true}
                rightIconName="close"
                onPress={() => toggleExercise(item.id)}
                onRightIconPress={() => toggleExercise(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title={isReplaceMode ? 'Replace Exercise' : `Add Exercise${selectedExercises.size > 0 ? ` (${selectedExercises.size})` : ''}`}
          variant="primary"
          onPress={handleAdd}
          disabled={selectedExercises.size === 0 || isAdding}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    searchInput: {
      marginBottom: 0,
    },
    selectedSection: {
      maxHeight: 220,
      backgroundColor: c.surfaceLight,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: spacing.md,
    },
    selectedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    selectedTitle: {
      fontSize: 14,
      fontWeight: fontWeight.bold,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    selectedScroll: {
      paddingHorizontal: spacing.lg,
    },
    selectedContent: {
      paddingBottom: spacing.md,
    },
    footer: {
      padding: spacing.lg,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    addBtn: {
      width: '100%',
    },
  });
}
