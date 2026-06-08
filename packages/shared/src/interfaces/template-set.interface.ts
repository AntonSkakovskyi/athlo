export interface ITemplateSet {
  id: number;
  templateExerciseId: number;
  order: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  distance?: number | null;
}
