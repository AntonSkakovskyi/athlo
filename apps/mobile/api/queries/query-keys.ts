export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (filters: Record<string, unknown>) => [...exerciseKeys.all, filters] as const,
};

export const muscleKeys = {
  all: ['muscles'] as const,
};

export const equipmentKeys = {
  all: ['equipments'] as const,
};

export const workoutKeys = {
  all: ['workouts'] as const,
  byId: (id: string) => [...workoutKeys.all, id] as const,
};

export const templateKeys = {
  all: ['templates'] as const,
  byId: (id: string) => [...templateKeys.all, id] as const,
  public: [...['templates'], 'public'] as const,
  saved: [...['templates'], 'saved'] as const,
};

export const profileKeys = {
  me: ['profile'] as const,
};

export const bodyMetricKeys = {
  all: ['body-metrics'] as const,
  byType: (metricTypeId: string) => [...bodyMetricKeys.all, { metricTypeId }] as const,
  metricTypes: ['metric-types'] as const,
};

export const foodKeys = {
  all: ['foods'] as const,
  search: (query: string) => [...foodKeys.all, { query }] as const,
  byId: (id: string) => [...foodKeys.all, id] as const,
};

export const mealTypeKeys = {
  all: ['meal-types'] as const,
};

export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  byId: (id: string) => [...mealPlanKeys.all, id] as const,
  active: [...['meal-plans'], 'active'] as const,
};

export const nutritionLogKeys = {
  summary: (date: string) => ['nutrition-log', 'summary', date] as const,
  meals: (date: string) => ['nutrition-log', 'meals', date] as const,
  mealById: (id: string) => ['nutrition-log', 'meals', id] as const,
  water: (date: string) => ['nutrition-log', 'water', date] as const,
};

