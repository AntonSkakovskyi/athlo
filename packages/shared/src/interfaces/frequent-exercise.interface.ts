export interface IFrequentExercise {
  exerciseId: number;
  exerciseName: string;
  equipmentName: string | null;
  primaryMuscles: string[];
  trackingType: string;
  totalSets: number;
  totalWorkouts: number;
}
