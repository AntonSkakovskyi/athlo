export const apiRoutes = {
  auth: {
    register: 'auth/register',
    login: 'auth/login',
  },
  exercises: {
    getAll: 'exercises',
  },
  muscles: {
    getAll: 'muscles',
  },
  equipments: {
    getAll: 'equipments',
  },
  workouts: {
    getAll: 'workouts',
    getById: (id: string) => `workouts/${id}`,
    complete: (id: string) => `workouts/${id}/complete`,
    exercises: (workoutId: string) => `workouts/${workoutId}/exercises`,
    exercise: (workoutId: string, id: string) => `workouts/${workoutId}/exercises/${id}`,
    sets: (workoutId: string, logExerciseId: string) =>
      `workouts/${workoutId}/exercises/${logExerciseId}/sets`,
    set: (workoutId: string, logExerciseId: string, id: string) =>
      `workouts/${workoutId}/exercises/${logExerciseId}/sets/${id}`,
  },
  templates: {
    getAll: 'templates',
    getById: (id: string) => `templates/${id}`,
    getPublic: 'templates/public',
    getSaved: 'templates/saved',
    save: (id: string) => `templates/${id}/save`,
    start: (id: string) => `templates/${id}/start`,
    exercises: (templateId: string) => `templates/${templateId}/exercises`,
    exercise: (templateId: string, id: string) => `templates/${templateId}/exercises/${id}`,
    sets: (templateId: string, exerciseId: string) =>
      `templates/${templateId}/exercises/${exerciseId}/sets`,
    set: (templateId: string, exerciseId: string, id: string) =>
      `templates/${templateId}/exercises/${exerciseId}/sets/${id}`,
  },
  profile: {
    get: 'profile',
    update: 'profile',
  },
  bodyMetrics: {
    getAll: 'body-metrics',
    getById: (id: string) => `body-metrics/${id}`,
    metricTypes: 'body-metrics/metric-types',
  },
  foods: {
    getAll: 'foods',
    getById: (id: string) => `foods/${id}`,
  },
  mealTypes: {
    getAll: 'meal-types',
  },
  mealPlans: {
    getAll: 'meal-plans',
    getById: (id: string) => `meal-plans/${id}`,
    active: 'meal-plans/active',
    activate: (id: string) => `meal-plans/${id}/activate`,
    deactivate: 'meal-plans/deactivate',
    days: (planId: string) => `meal-plans/${planId}/days`,
    day: (planId: string, dayId: string) => `meal-plans/${planId}/days/${dayId}`,
    meals: (planId: string, dayId: string) => `meal-plans/${planId}/days/${dayId}/meals`,
    meal: (planId: string, mealId: string) => `meal-plans/${planId}/meals/${mealId}`,
    mealItems: (planId: string, mealId: string) => `meal-plans/${planId}/meals/${mealId}/items`,
    mealItem: (planId: string, itemId: string) => `meal-plans/${planId}/items/${itemId}`,
  },
  nutritionLog: {
    summary: 'nutrition-log/summary',
    meals: 'nutrition-log/meals',
    mealById: (id: string) => `nutrition-log/meals/${id}`,
    mealItems: (mealId: string) => `nutrition-log/meals/${mealId}/items`,
    mealItem: (itemId: string) => `nutrition-log/meal-items/${itemId}`,
    water: 'nutrition-log/water',
    waterById: (id: string) => `nutrition-log/water/${id}`,
  },
};