export interface IFinalizedSet {
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
}

export interface IFinalizedExercise {
  logExerciseId: number;
  sets: IFinalizedSet[];
}
