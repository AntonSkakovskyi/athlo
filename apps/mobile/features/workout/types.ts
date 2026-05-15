export type { IWorkoutWithRelations as WorkoutWithRelations } from '@athlo/shared';

import type { ITemplateExercise, ITemplateSet, IWorkoutTemplate, IExercise } from '@athlo/shared';

export interface TemplateExerciseWithRelations extends ITemplateExercise {
  exercise?: IExercise & { equipment?: { id: number; name: string } };
  templateSets?: ITemplateSet[];
}

export interface TemplateWithRelations extends IWorkoutTemplate {
  templateExercises?: TemplateExerciseWithRelations[];
}
