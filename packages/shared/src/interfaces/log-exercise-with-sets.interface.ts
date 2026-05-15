import type { ILogExercise } from './log-exercise.interface.js';
import type { ILogSet } from './log-set.interface.js';

export interface ILogExerciseWithSets extends ILogExercise {
  exercise?: { name: string; trackingTypeId?: number };
  sets?: ILogSet[];
}
