export interface MacroValues {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export function calcItemMacros(
  food: MacroValues | null | undefined,
  amountInGrams: number,
): MacroValues {
  if (!food) return { calories: 0, proteins: 0, fats: 0, carbs: 0 };
  const factor = amountInGrams / 100;
  return {
    calories: food.calories * factor,
    proteins: food.proteins * factor,
    fats: food.fats * factor,
    carbs: food.carbs * factor,
  };
}

export function sumMacros(values: MacroValues[]): MacroValues {
  return values.reduce<MacroValues>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteins: acc.proteins + m.proteins,
      fats: acc.fats + m.fats,
      carbs: acc.carbs + m.carbs,
    }),
    { calories: 0, proteins: 0, fats: 0, carbs: 0 },
  );
}
