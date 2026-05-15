import type { IWorkout } from './workout.interface.js';
import type { ILogExerciseWithSets } from './log-exercise-with-sets.interface.js';

export interface IWorkoutWithRelations extends IWorkout {
  logExercises?: ILogExerciseWithSets[];
}
