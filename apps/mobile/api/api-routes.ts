export const apiRoutes = {
  auth: {
    register: 'auth/register',
    login: 'auth/login',
  },
  exercises: {
    getAll: `exercises`,
    getById: (id: string) => `exercises/${id}`,
  },
  workouts: {
    getAll: `workouts`,
    getById: (id: string) => `workouts/${id}`,
  },
};