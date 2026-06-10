import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Tag } from '@/components/ui/Tag/Tag';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Card } from '@/components/ui/Card/Card';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { ExerciseLogCard } from '@/features/workout/components/ExerciseLogCard/ExerciseLogCard';
import { EditExerciseModal } from '@/features/workout/components';
import { useExerciseDetailScreen } from '@/features/profile/hooks/useExerciseDetailScreen';
import { Ionicons } from '@expo/vector-icons';
import { TrackingMetric } from '@athlo/shared';

export default function ExerciseDetailScreen() {
  const {
    insets,
    router,
    params,
    periodLabel,
    setPeriodLabel,
    metricIndex,
    setMetricIndex,
    progress,
    prHistory,
    isLoading,
    metrics,
    currentMetric,
    chartData,
    exerciseMuscles,
    historyRecords,
    formatMetricValue,
    PERIOD_LABELS,
    trackingType,
    isOwner,
    showEditModal,
    setShowEditModal,
    updateExercise,
    deleteExercise,
    handleUpdate,
    handleDelete,
    exercise,
    trackingTypesQuery,
    musclesQuery,
    equipmentsQuery,
  } = useExerciseDetailScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [descExpanded, setDescExpanded] = useState(false);

  const renderHeader = () => {
    const currentPRs = (prHistory ?? []).reduce((acc, curr) => {
      const key = curr.trackingMetric?.name ?? String(curr.metricTypeId);
      if (!acc[key] || new Date(curr.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = curr;
      }
      return acc;
    }, {} as Record<string, any>);

    return (
      <View style={styles.headerContent}>
        <View style={styles.topBar}>
          <ScreenHeader title={params.exerciseName ?? 'Exercise'} onBack={() => router.back()} />
          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowEditModal(true)}
                hitSlop={8}
              >
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={handleDelete}
                disabled={deleteExercise.isPending}
                hitSlop={8}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={deleteExercise.isPending ? colors.textMuted : colors.danger}
                />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.exerciseInfo}>
          {exercise?.imageUrl ? (
            <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
          ) : (
            <View style={styles.exerciseImagePlaceholder}>
              <Text style={styles.exerciseImageEmoji}>💪</Text>
            </View>
          )}
          <Text style={styles.exerciseName}>{params.exerciseName}</Text>
          {(exerciseMuscles.primary.length > 0 || exerciseMuscles.secondary.length > 0) && (
            <View style={styles.muscleRow}>
              {exerciseMuscles.primary.map((m) => (
                <Tag key={m} label={m} color="primary" />
              ))}
              {exerciseMuscles.secondary.map((m) => (
                <Tag key={m} label={m} />
              ))}
            </View>
          )}
        </View>

        {!!exercise?.description && (
          <Pressable style={styles.descContainer} onPress={() => setDescExpanded((v) => !v)}>
            <Text style={styles.descToggle}>{descExpanded ? 'Description ▴' : 'Description ▾'}</Text>
            {descExpanded && <Text style={styles.descText}>{exercise.description}</Text>}
          </Pressable>
        )}

        {Object.keys(currentPRs).length > 0 && (
          <View style={styles.prsContainer}>
            <Text style={styles.prsTitle}>Personal Records</Text>
            <View style={styles.prsRow}>
              {Object.values(currentPRs).map((pr: any) => {
                const metricName = pr.trackingMetric?.name ?? String(pr.metricTypeId);
                return (
                <Card key={metricName} style={styles.prCard}>
                  <Text style={styles.prTrophy}>🏆</Text>
                  <Text style={styles.prMetricType}>{metricName}</Text>
                  <Text style={styles.prValue}>
                    {metricName === TrackingMetric.WEIGHT || metricName === TrackingMetric.ESTIMATED_1RM
                      ? `${Math.round(pr.value * 10) / 10} kg`
                      : metricName === TrackingMetric.VOLUME
                      ? `${Math.round(pr.value)} kg`
                      : metricName === TrackingMetric.DURATION
                      ? `${Math.floor(pr.value / 60)}:${String(pr.value % 60).padStart(2, '0')}`
                      : pr.value}
                  </Text>
                </Card>
                );
              })}
            </View>
          </View>
        )}

        {isLoading ? (
          <Spinner style={styles.loader} />
        ) : (
          <LineChartBlock
            metricLabel={currentMetric}
            data={chartData}
            period={periodLabel}
            onPeriodChange={setPeriodLabel}
            periods={PERIOD_LABELS}
            formatValue={(v) => formatMetricValue(v, currentMetric)}
            emptyText="Perform this exercise to see your progress"
            metrics={metrics}
            activeMetric={metricIndex}
            onMetricChange={setMetricIndex}
          />
        )}

        {historyRecords.length > 0 && <Text style={styles.historyTitle}>History</Text>}
      </View>
    );
  };

  return (
    <>
      <InfiniteList
        data={historyRecords}
        keyExtractor={(item) => String(item.workoutId)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.historyCardWrapper}
            onPress={() =>
              router.push({
                pathname: '/(app)/(workout)/workout-summary',
                params: { workoutId: String(item.workoutId) },
              })
            }
          >
            <Text style={styles.historyDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <ExerciseLogCard
              exerciseName={params.exerciseName ?? ''}
              trackingType={trackingType}
              mode="summary"
              isEditing={false}
              sets={item.sets ?? []}
              showNotes={false}
              onUpdateSet={() => {}}
            />
          </Pressable>
        )}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 8, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      />

      {isOwner && exercise && (
        <EditExerciseModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
          isPending={updateExercise.isPending}
          exercise={exercise}
          trackingTypes={trackingTypesQuery.data ?? []}
          muscles={musclesQuery.data ?? []}
          equipments={equipmentsQuery.data ?? []}
          topPadding={insets.top + spacing.lg}
        />
      )}
    </>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
    },
    headerContent: {
      marginBottom: spacing.md,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ownerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: spacing.lg,
      gap: spacing.sm,
    },
    actionBtn: {
      padding: spacing.sm,
    },
    exerciseInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    exerciseImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    exerciseImage: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: borderRadius.lg,
      backgroundColor: c.surfaceLight,
      marginBottom: 12,
      resizeMode: 'cover',
    },
    exerciseImageEmoji: {
      fontSize: 32,
    },
    exerciseName: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    muscleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
    },
    prsContainer: {
      marginBottom: spacing.lg,
    },
    prsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.md,
    },
    prsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    prCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: spacing.md,
    },
    prTrophy: {
      fontSize: 24,
      marginBottom: 4,
    },
    prMetricType: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    prValue: {
      fontSize: 18,
      fontWeight: '700',
      color: c.primary,
    },
    descContainer: {
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    descToggle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    descText: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    loader: {
      marginVertical: 40,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginTop: spacing.md,
      marginBottom: 12,
    },
    historyCardWrapper: {
      marginBottom: spacing.sm,
    },
    historyDate: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },
  });
}
