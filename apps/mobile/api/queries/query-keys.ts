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
