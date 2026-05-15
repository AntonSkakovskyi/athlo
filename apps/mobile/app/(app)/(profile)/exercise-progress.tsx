import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { IFrequentExercise } from '@athlo/shared';
import { colors, spacing } from '@/constants/theme';
import { useFrequentExercises } from '../../../hooks/api/useStatisticsHooks';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { Input } from '@/components/ui/Input/Input';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { ExerciseProgressListItem } from '../../../components/profile/ExerciseProgressListItem';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export default function ExerciseProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => setDebouncedSearch(text.length >= 2 ? text : ''), 300);
      setDebounceTimer(timer);
    },
    [debounceTimer],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFrequentExercises(debouncedSearch || undefined);

  const exercises = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const handleExercisePress = useCallback(
    (exercise: IFrequentExercise) => {
      router.push({
        pathname: '/(app)/(profile)/exercise-detail',
        params: {
          exerciseId: String(exercise.exerciseId),
          exerciseName: exercise.exerciseName,
          trackingType: exercise.trackingType,
        },
      });
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <FlatList
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
      keyExtractor={(item) => String(item.exerciseId)}
      renderItem={({ item }) => (
        <ExerciseProgressListItem
          exercise={item}
          onPress={() => handleExercisePress(item)}
        />
      )}
      ListEmptyComponent={
        isLoading ? (
          <Spinner style={styles.loader} />
        ) : (
          <EmptyState
            title="Start working out to track your progress"
            description="Exercises you perform will appear here sorted by frequency"
          />
        )
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? (
          <Spinner style={styles.loader} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  searchSection: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 30,
  },
});
