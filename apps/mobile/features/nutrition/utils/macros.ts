export interface MacroValues {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface NutritionFactLike extends MacroValues {
  unitId: number;
  amount: number;
}

export function calcItemMacros(
  nutritionFact: MacroValues | null | undefined,
  multiplier: number,
): MacroValues {
  if (!nutritionFact) return { calories: 0, proteins: 0, fats: 0, carbs: 0 };
  return {
    calories: nutritionFact.calories * multiplier,
    proteins: nutritionFact.proteins * multiplier,
    fats: nutritionFact.fats * multiplier,
    carbs: nutritionFact.carbs * multiplier,
  };
}

export function calcItemMacrosByUnit(
  foodUnits: NutritionFactLike[] | undefined,
  unitId: number,
  amount: number,
): MacroValues {
  const fact = foodUnits?.find((u) => u.unitId === unitId);
  if (!fact) return { calories: 0, proteins: 0, fats: 0, carbs: 0 };
  return calcItemMacros(fact, amount / Number(fact.amount || 1));
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
