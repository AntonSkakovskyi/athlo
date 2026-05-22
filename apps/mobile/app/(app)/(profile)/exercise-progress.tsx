import { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useInfiniteExercises } from '@/hooks/api/useExerciseAPI';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Input } from '@/components/ui/Input/Input';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { ExerciseProgressListItem } from '@/features/profile/components';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import type { ExerciseWithRelations } from '@/hooks/api/useExerciseAPI';

export default function ExerciseProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedSearch(text.trim()), 300);
      setDebounceTimer(timer);
    },
    [debounceTimer],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteExercises({ search: debouncedSearch || undefined });

  const exercises = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const handleExercisePress = useCallback(
    (exercise: ExerciseWithRelations) => {
      router.push({
        pathname: '/(app)/(profile)/exercise-detail',
        params: {
          exerciseId: String(exercise.id),
          exerciseName: exercise.name,
          trackingType: exercise.trackingType?.name || '',
        },
      });
    },
    [router],
  );

  return (
    <InfiniteList
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <ScreenHeader title="Exercise Progress" onBack={() => router.back()} />
          <View style={styles.searchSection}>
            <Input
              label="Search Exercise"
              placeholder="Type exercise name..."
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>
        </View>
      }
      data={exercises}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ExerciseProgressListItem
          exercise={{
            exerciseId: item.id,
            exerciseName: item.name,
            equipmentName: item.equipment?.name || '',
            trackingType: item.trackingType?.name || '',
            totalSets: item.totalSets || 0,
            totalWorkouts: item.totalWorkouts || 0,
            primaryMuscles: item.exerciseMuscles?.filter(m => m.isPrimary).map(m => m.muscle.name) || []
          }}
          onPress={() => handleExercisePress(item)}
        />
      )}
      ListEmptyComponent={
        isLoading ? (
          <Spinner style={styles.loader} />
        ) : (
          <EmptyState
            title="No exercises found"
            description="Start working out or adjust your search to see progress"
          />
        )
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: spacing.lg,
    },
    searchSection: {
      marginBottom: spacing.lg,
    },
    loader: {
      marginVertical: 30,
    },
  });
}
