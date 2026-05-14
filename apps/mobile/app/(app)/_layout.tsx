import { useState, useEffect } from 'react';
import { Redirect, Tabs, useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveWorkout } from '../../contexts/ActiveWorkoutContext';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { useDeleteWorkout } from '../../hooks/api/useWorkoutHooks';

function FloatingWorkoutMini() {
  const { workout, isActive, exercises, completedSets, totalSets, endWorkout } = useActiveWorkout();
  const router = useRouter();
  const pathname = usePathname();
  const deleteWorkout = useDeleteWorkout();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!isActive || !workout) return;
    const start = new Date(workout.started_at).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, workout]);

  const isHomeTab = pathname === '/(app)/(workout)' || pathname.endsWith('/(workout)');
  if (!isActive || !workout || !isHomeTab) return null;

  const currentExercise = exercises.find((e) => e.sets.some((s) => !s.isCompleted));
  const currentSetIndex = currentExercise
    ? currentExercise.sets.findIndex((s) => !s.isCompleted) + 1
    : 0;

  const handleDelete = () => {
    Alert.alert(
      'Discard Workout',
      'All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout.mutate(String(workout.id), {
              onSuccess: () => endWorkout(),
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.miniPlayer}>
      <Pressable
        style={styles.miniCircleBtn}
        onPress={() => router.push('/(app)/(workout)/active-workout')}
      >
        <Text style={styles.miniCircleIcon}>↑</Text>
      </Pressable>

      <View>
        <Text style={styles.miniTitle} numberOfLines={1}>
          Active workout · {elapsed}
        </Text>
        {currentExercise ? (
          <Text style={styles.miniSubtitle} numberOfLines={1}>
            {currentExercise.exerciseName} · Set {currentSetIndex}/{currentExercise.sets.length}
          </Text>
        ) : (
          <Text style={styles.miniSubtitle}>{completedSets}/{totalSets} sets done</Text>
        )}
      </View>

      <Pressable style={[styles.miniCircleBtn, styles.miniCircleBtnDanger]} onPress={handleDelete}>
        <Text style={styles.miniCircleIcon}>🗑</Text>
      </Pressable>
    </View>
  );
}

export default function AppLayout() {
  const { token, isLoading } = useAuth();
  const { isActive } = useActiveWorkout();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      >
        <Tabs.Screen
          name="(nutrition)"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍎</Text>,
          }}
        />
        <Tabs.Screen
          name="(workout)"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏋️</Text>,
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          }}
        />
      </Tabs>
      {isActive && <FloatingWorkoutMini />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  miniCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCircleBtnDanger: {
    backgroundColor: colors.dangerLight,
  },
  miniCircleIcon: {
    fontSize: 18,
    color: '#000',
  },

  miniTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  miniSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
