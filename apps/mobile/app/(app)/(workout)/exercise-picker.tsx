import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { spacing, fontWeight, fontSize, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Typography } from '@/components/ui/Typography/Typography';
import { ExerciseListItem, CreateExerciseModal } from '@/features/workout/components';
import { trackingTypeIcon } from '@/utils/workout';
import { useExercisePickerScreen } from '@/features/workout/hooks/useExercisePickerScreen';
import { EquipmentFilter } from './exercise-picker/components/EquipmentFilter/EquipmentFilter';
import type { ExerciseWithRelations } from '@/hooks/api';

type ListItem =
  | { type: 'header'; title: string; count?: number }
  | { type: 'exercise'; data: ExerciseWithRelations };

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
    trackingTypesQuery,
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
    user,
    showCreateModal,
    setShowCreateModal,
    createExercise,
    handleCreateExercise,
  } = useExercisePickerScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const selectedList = useMemo(() => Array.from(selectedExercises.values()), [selectedExercises]);

  const filteredCatalogList = useMemo(
    () => exerciseList.filter((ex) => !selectedExercises.has(ex.id)),
    [exerciseList, selectedExercises],
  );

  const virtualList = useMemo<ListItem[]>(() => {
    if (!user) return filteredCatalogList.map((ex) => ({ type: 'exercise', data: ex }));

    const myExercises = filteredCatalogList.filter((ex) => ex.userId === user.id);
    const others = filteredCatalogList.filter((ex) => ex.userId !== user.id);

    const list: ListItem[] = [];

    if (myExercises.length > 0) {
      list.push({ type: 'header', title: 'My Exercises', count: myExercises.length });
      myExercises.forEach((ex) => list.push({ type: 'exercise', data: ex }));
    }

    list.push({ type: 'header', title: search ? 'Search Results' : 'All Exercises' });
    others.forEach((ex) => list.push({ type: 'exercise', data: ex }));

    return list;
  }, [filteredCatalogList, user, search]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <View style={styles.headerTitleRow}>
              <Typography variant="h4" style={styles.sectionTitle}>
                {item.title}
              </Typography>
              {item.count !== undefined && item.count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.count}</Text>
                </View>
              )}
            </View>
          </View>
        );
      }

      const ex = item.data;
      const muscles = ex.exerciseMuscles
        ?.filter((m) => m.isPrimary)
        .map((m) => m.muscle?.name)
        .filter(Boolean)
        .join(', ');

      return (
        <ExerciseListItem
          name={ex.name}
          trackingIcon={trackingTypeIcon(ex.trackingTypeId)}
          equipment={ex.equipment?.name}
          muscles={muscles}
          selected={selectedExercises.has(ex.id)}
          onPress={() => toggleExercise(ex.id)}
          onRightIconPress={() =>
            router.push({
              pathname: '/(app)/(workout)/exercise-detail',
              params: {
                exerciseId: String(ex.id),
                exerciseName: ex.name,
                trackingType: ex.trackingType?.name || '',
              },
            })
          }
        />
      );
    },
    [colors, selectedExercises, toggleExercise, router, styles],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <ScreenHeader
          title={isReplaceMode ? 'Replace Exercise' : 'Choose Exercise'}
          onBack={() => router.back()}
        />
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.createBtn}>
          <Text style={[styles.createBtnText, { color: colors.primary }]}>+ Create</Text>
        </Pressable>
      </View>

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

      {exercisesQuery.isLoading ? (
        <Spinner size="large" style={styles.loader} />
      ) : (
        <InfiniteList
          data={virtualList}
          keyExtractor={(item) =>
            item.type === 'header' ? `header-${item.title}` : `exercise-${item.data.id}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          hasNextPage={exercisesQuery.hasNextPage}
          isFetchingNextPage={exercisesQuery.isFetchingNextPage}
          onLoadMore={() => exercisesQuery.fetchNextPage()}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No exercises found"
                description={search ? 'Try a different search term' : 'Search or create your own exercise'}
                actionLabel="+ Create Exercise"
                onAction={() => setShowCreateModal(true)}
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
          title={
            isReplaceMode
              ? 'Replace Exercise'
              : `Add Exercise${selectedExercises.size > 0 ? ` (${selectedExercises.size})` : ''}`
          }
          variant="primary"
          onPress={handleAdd}
          disabled={selectedExercises.size === 0 || isAdding}
          style={styles.addBtn}
        />
      </View>

      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateExercise}
        isPending={createExercise.isPending}
        trackingTypes={trackingTypesQuery.data ?? []}
        muscles={musclesQuery.data ?? []}
        equipments={equipmentsQuery.data ?? []}
        topPadding={insets.top + spacing.lg}
      />
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.lg,
    },
    createBtn: {
      paddingVertical: spacing.sm,
      paddingLeft: spacing.sm,
    },
    createBtnText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    searchInput: {
      marginBottom: 0,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 20,
    },
    loader: {
      marginTop: 40,
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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: c.background,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    countBadge: {
      backgroundColor: c.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.sm,
    },
    countText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.primary,
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
