// Значення мають збігатися з тим, що пише AchievementService у
// user_exercise_records.metric_type — інакше фільтри по енуму повертають порожнечу
export enum TrackingMetric {
  WEIGHT = 'WEIGHT',
  REPS = 'REPS',
  DURATION = 'DURATION',
  DISTANCE = 'DISTANCE',
  VOLUME = 'VOLUME',
  ESTIMATED_1RM = '1RM',
}
