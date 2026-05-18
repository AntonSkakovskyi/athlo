import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { IMuscle, IEquipment } from '@athlo/shared';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { ExerciseListItem } from '@/features/workout/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { trackingTypeIcon } from '@/utils/workout';
import { useExercisePickerScreen } from '@/features/workout/hooks/useExercisePickerScreen';
import { ExerciseWithRelations } from '@/hooks/api/useExerciseAPI';
import { BottomSheet, BottomSheetItem } from '@/components/ui/BottomSheet/BottomSheet';
import { Ionicons } from '@expo/vector-icons';

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

  const [muscleSheetVisible, setMuscleSheetVisible] = useState(false);
  const [equipmentSheetVisible, setEquipmentSheetVisible] = useState(false);
  
  const [muscleSearch, setMuscleSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const filteredMuscles = useMemo(() => {
    if (!musclesQuery.data) return [];
    return musclesQuery.data.filter((m) =>
      m.name.toLowerCase().includes(muscleSearch.toLowerCase())
    );
  }, [musclesQuery.data, muscleSearch]);

  const filteredEquipments = useMemo(() => {
    if (!equipmentsQuery.data) return [];
    return equipmentsQuery.data.filter((e) =>
      e.name.toLowerCase().includes(equipmentSearch.toLowerCase())
    );
  }, [equipmentsQuery.data, equipmentSearch]);

  const selectedMuscleName = musclesQuery.data?.find((m) => m.id === selectedMuscleId)?.name || 'Muscles';
  const selectedEquipmentName =
    selectedEquipmentId === -1
      ? 'No equipment'
      : equipmentsQuery.data?.find((e) => e.id === selectedEquipmentId)?.name || 'Equipment';

  // FIX: Convert Map to array for rendering
  const selectedList = useMemo(() => Array.from(selectedExercises.values()), [selectedExercises]);

  // Filter out already selected exercises from the main catalog list
  const filteredCatalogList = useMemo(() => {
    return exerciseList.filter(ex => !selectedExercises.has(ex.id));
  }, [exerciseList, selectedExercises]);

  const renderExercise = ({ item }: { item: ExerciseWithRelations }) => {
    const isSelected = selectedExercises.has(item.id);
    const muscles = item.exerciseMuscles
      ?.filter((m) => m.isPrimary)
      .map((m) => m.muscle?.name)
      .filter(Boolean)
      .join(', ');

    return (
      <ExerciseListItem
        name={item.name}
        trackingIcon={trackingTypeIcon(item.trackingTypeId)}
        equipment={item.equipment?.name}
        muscles={muscles}
        selected={isSelected}
        onPress={() => toggleExercise(item.id)}
        onRightIconPress={() => {
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
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title={isReplaceMode ? 'Replace Exercise' : 'Choose Exercise'} onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search exercises..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterBtnWrap}>
          <Pressable
            style={[styles.filterBtn, !!selectedMuscleId ? styles.filterBtnActive : null]}
            onPress={() => setMuscleSheetVisible(true)}
          >
            <Text style={[styles.filterBtnText, !!selectedMuscleId ? styles.filterBtnTextActive : null]} numberOfLines={1}>
              {selectedMuscleName}
            </Text>
            {selectedMuscleId ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleMuscle(selectedMuscleId);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            )}
          </Pressable>
        </View>

        <View style={styles.filterBtnWrap}>
          <Pressable
            style={[styles.filterBtn, !!selectedEquipmentId ? styles.filterBtnActive : null]}
            onPress={() => setEquipmentSheetVisible(true)}
          >
            <Text style={[styles.filterBtnText, !!selectedEquipmentId ? styles.filterBtnTextActive : null]} numberOfLines={1}>
              {selectedEquipmentName}
            </Text>
            {selectedEquipmentId ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleEquipment(selectedEquipmentId);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.listWrap}>
        {exercisesQuery.isLoading ? (
          <Spinner size="large" style={styles.loader} />
        ) : (
          <InfiniteList
            data={filteredCatalogList}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderExercise}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            hasNextPage={exercisesQuery.hasNextPage}
            isFetchingNextPage={exercisesQuery.isFetchingNextPage}
            onLoadMore={() => exercisesQuery.fetchNextPage()}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <EmptyState
                  title="No exercises found"
                  description="Try adjusting your search or filters"
                />
                {hasFilters && (
                  <Button
                    title="Reset Filters"
                    variant="outline"
                    onPress={clearFilters}
                    style={styles.resetBtn}
                  />
                )}
              </View>
            }
          />
        )}
      </View>

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

      <BottomSheet
        visible={muscleSheetVisible}
        onClose={() => {
          setMuscleSheetVisible(false);
          setMuscleSearch('');
        }}
        title="Select Muscle"
      >
        <View style={styles.sheetSearchWrap}>
          <Input
            placeholder="Search muscles..."
            value={muscleSearch}
            onChangeText={setMuscleSearch}
            style={styles.sheetSearchInput}
          />
        </View>
        {filteredMuscles.length > 0 ? (
          filteredMuscles.map((muscle: IMuscle) => (
            <BottomSheetItem
              key={muscle.id}
              label={muscle.name}
              onPress={() => {
                toggleMuscle(muscle.id);
                setMuscleSheetVisible(false);
                setMuscleSearch('');
              }}
            />
          ))
        ) : (
          <Text style={styles.noResults}>No muscles found</Text>
        )}
      </BottomSheet>

      <BottomSheet
        visible={equipmentSheetVisible}
        onClose={() => {
          setEquipmentSheetVisible(false);
          setEquipmentSearch('');
        }}
        title="Select Equipment"
      >
        <View style={styles.sheetSearchWrap}>
          <Input
            placeholder="Search equipment..."
            value={equipmentSearch}
            onChangeText={setEquipmentSearch}
            style={styles.sheetSearchInput}
          />
        </View>
        {!equipmentSearch && (
          <BottomSheetItem
            label="No equipment"
            onPress={() => {
              toggleEquipment(-1);
              setEquipmentSheetVisible(false);
              setEquipmentSearch('');
            }}
          />
        )}
        {filteredEquipments.length > 0 ? (
          filteredEquipments.map((eq: IEquipment) => (
            <BottomSheetItem
              key={eq.id}
              label={eq.name}
              onPress={() => {
                toggleEquipment(eq.id);
                setEquipmentSheetVisible(false);
                setEquipmentSearch('');
              }}
            />
          ))
        ) : (
          <Text style={styles.noResults}>No equipment found</Text>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    gap: spacing.sm,
  },
  filterBtnWrap: {
    flex: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.xs,
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  filterBtnText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  filterBtnTextActive: {
    color: colors.primary,
  },
  listWrap: {
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  resetBtn: {
    marginTop: spacing.md,
    minWidth: 150,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  selectedSection: {
    maxHeight: 220,
    backgroundColor: colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    width: '100%',
  },
  loader: {
    marginTop: 40,
  },
  sheetSearchWrap: {
    paddingHorizontal: spacing.sm,
  },
  sheetSearchInput: {
    backgroundColor: colors.surfaceLight,
    fontSize: fontSize.md,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
