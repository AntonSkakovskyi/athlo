export const apiRoutes = {
  exercises: {
    getAll: '/exercises',
    getById: '/exercises/:id'
  },
  workouts: {
    getAll: '/workouts',
    byId: (id: string) => `workouts/${id}`
  }
}