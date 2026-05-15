import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { useAppLayout } from '@/features/auth/hooks/useAppLayout';
import { FloatingWorkoutMini } from '@/features/workout/components/FloatingWorkoutMini/FloatingWorkoutMini';

export default function AppLayout() {
  const { token, isLoading, isActive } = useAppLayout();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
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
          tabBarLabelStyle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
        }}
      >
        <Tabs.Screen
          name="(nutrition)"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🍎</Text>,
          }}
        />
        <Tabs.Screen
          name="(workout)"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏋️</Text>,
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
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
    paddingBottom: spacing.xs,
  },
  tabIcon: { fontSize: fontSize.xl },
});
