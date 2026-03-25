export const workoutQueryKey = {
  all: ['workouts'] as const,
  byId: (id: string) => [...workoutQueryKey.all, id] as const
}