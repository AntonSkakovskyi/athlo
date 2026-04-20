import { Redirect, Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveWorkout } from '../../contexts/ActiveWorkoutContext';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

function FloatingWorkoutMini() {
  const { workout, isActive, exercises, completedSets, totalSets } = useActiveWorkout();
  const router = useRouter();

  if (!isActive || !workout) return null;

  const currentExercise = exercises.find((e) =>
    e.sets.some((s) => !s.isCompleted),
  );
  const currentSetIndex = currentExercise
    ? currentExercise.sets.findIndex((s) => !s.isCompleted) + 1
    : 0;

  return (
    <Pressable
      style={styles.miniPlayer}
      onPress={() => router.push('/(app)/active-workout')}
    >
      <View style={styles.miniLeft}>
        <Text style={styles.miniTitle} numberOfLines={1}>
          🏋️ {workout.name}
        </Text>
        {currentExercise && (
          <Text style={styles.miniSubtitle} numberOfLines={1}>
            ↳ {currentExercise.exerciseName} — Set {currentSetIndex}/{currentExercise.sets.length}
          </Text>
        )}
      </View>
      <Text style={styles.miniSets}>
        {completedSets}/{totalSets}
      </Text>
    </Pressable>
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
          name="home"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏋️</Text>,
          }}
        />
        <Tabs.Screen name="templates" options={{ href: null }} />
        <Tabs.Screen name="template/[id]" options={{ href: null }} />
        <Tabs.Screen name="active-workout" options={{ href: null }} />
        <Tabs.Screen name="exercise-picker" options={{ href: null }} />
        <Tabs.Screen
          name="(nutrition)"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍎</Text>,
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
    bottom: 62,
    left: 16,
    right: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  miniLeft: { flex: 1 },
  miniTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  miniSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniSets: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 12,
  },
});
