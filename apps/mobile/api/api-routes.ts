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
};