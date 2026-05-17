export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (filters: Record<string, unknown>) => ['exercises', filters] as const,
  byId: (id: string) => ['exercises', id] as const,
  infinite: (filters: Record<string, unknown>) => ['exercises', filters, 'infinite'] as const,
};

export const muscleKeys = {
  all: ['muscles'] as const,
};

export const equipmentKeys = {
  all: ['equipments'] as const,
};

export const workoutKeys = {
  all: ['workouts'] as const,
  infinite: ['workouts', 'infinite'] as const,
  infiniteByUser: (userId: string) => ['workouts', 'infinite', { userId }] as const,
  byId: (id: string) => ['workouts', id] as const,
};

export const templateKeys = {
  all: ['templates'] as const,
  byId: (id: string) => ['templates', id] as const,
  byUserId: (userId: string) => ['templates', { userId }] as const,
  public: ['templates', 'public'] as const,
  publicInfinite: ['templates', 'public', 'infinite'] as const,
  publicInfiniteSearch: (search?: string) =>
    ['templates', 'public', 'infinite', { search }] as const,
  saved: ['templates', 'saved'] as const,
};

export const profileKeys = {
  me: ['profile'] as const,
  byId: (id: string) => ['profile', id] as const,
  search: (query: string) => ['profile', 'search', { query }] as const,
};

export const bodyMetricKeys = {
  all: ['body-metrics'] as const,
  byType: (metricTypeId: string) => ['body-metrics', { metricTypeId }] as const,
  metricTypes: ['metric-types'] as const,
};

export const foodKeys = {
  all: ['foods'] as const,
  search: (query: string) => ['foods', { query }] as const,
  byId: (id: string) => ['foods', id] as const,
  infinite: (query: string) => ['foods', { query }, 'infinite'] as const,
};

export const mealTypeKeys = {
  all: ['meal-types'] as const,
};

export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  byId: (id: string) => ['meal-plans', id] as const,
  byUserId: (userId: string) => ['meal-plans', { userId }] as const,
  active: ['meal-plans', 'active'] as const,
};

export const nutritionLogKeys = {
  all: ['nutrition-log'] as const,
  summary: (date: string) => ['nutrition-log', 'summary', date] as const,
  history: (from: string, to: string) => ['nutrition-log', 'history', { from, to }] as const,
  meals: (date: string) => ['nutrition-log', 'meals', date] as const,
  mealById: (id: string) => ['nutrition-log', 'meals', id] as const,
  water: (date: string) => ['nutrition-log', 'water', date] as const,
};

export const statisticsKeys = {
  workouts: (from?: string, to?: string) => ['statistics', 'workouts', { from, to }] as const,
  frequentExercises: (search?: string, page?: number) =>
    ['statistics', 'exercises', 'frequent', { search, page }] as const,
  exerciseProgress: (exerciseId: string, from?: string, to?: string) =>
    ['statistics', 'exercises', exerciseId, { from, to }] as const,
  bodyMetricProgress: (metricTypeId: string, from?: string, to?: string) =>
    ['statistics', 'body-metrics', metricTypeId, { from, to }] as const,
  summary: ['statistics', 'summary'] as const,
};

export const lastPerformanceKeys = {
  byExercise: (exerciseId: string) => ['last-performance', exerciseId] as const,
  batch: (exerciseIds: number[]) => ['last-performance', 'batch', ...exerciseIds] as const,
};

export const friendKeys = {
  all: ['friends'] as const,
  incomingRequests: ['friends', 'requests', 'incoming'] as const,
  outgoingRequests: ['friends', 'requests', 'outgoing'] as const,
};

export const achievementKeys = {
  all: ['achievements'] as const,
  user: ['achievements', 'user'] as const,
  records: ['achievements', 'records'] as const,
  recordByExercise: (exerciseId: string) => ['achievements', 'records', exerciseId] as const,
};
