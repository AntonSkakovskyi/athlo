import { Gender, ActivityLevel, FitnessGoal } from '../enums/index.js';

export interface AnthropometryData {
  gender: Gender;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
}

export interface CalculatedGoals {
  waterGoal: number; // in ml
  proteinGoal: number; // in g
  fatGoal: number; // in g
  carbGoal: number; // in g
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

export function calculateGoals(data: AnthropometryData): CalculatedGoals {
  const { gender, age, weight, height, activityLevel, goal } = data;

  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === Gender.MALE) {
    bmr += 5;
  } else if (gender === Gender.FEMALE) {
    bmr -= 161;
  }

  // 2. Calculate TDEE
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2);

  // 3. Target Calories based on Goal
  let targetCalories = tdee;
  let proteinRatio = 0.3;
  let fatRatio = 0.3;
  let carbRatio = 0.4;

  switch (goal) {
    case FitnessGoal.LOSE_WEIGHT:
      targetCalories -= 500;
      proteinRatio = 0.4;
      fatRatio = 0.3;
      carbRatio = 0.3;
      break;
    case FitnessGoal.MAINTAIN:
      proteinRatio = 0.3;
      fatRatio = 0.3;
      carbRatio = 0.4;
      break;
    case FitnessGoal.BUILD_MUSCLE:
      targetCalories += 300;
      proteinRatio = 0.3;
      fatRatio = 0.25;
      carbRatio = 0.45;
      break;
  }

  const proteinGoal = Math.round((targetCalories * proteinRatio) / 4);
  const fatGoal = Math.round((targetCalories * fatRatio) / 9);
  const carbGoal = Math.round((targetCalories * carbRatio) / 4);

  // Baseline: 35ml per kg. Add 500ml for active or very active.
  let waterGoal = Math.round(weight * 35);
  if (activityLevel === ActivityLevel.ACTIVE || activityLevel === ActivityLevel.VERY_ACTIVE) {
    waterGoal += 500;
  }

  return {
    waterGoal,
    proteinGoal,
    fatGoal,
    carbGoal,
  };
}
