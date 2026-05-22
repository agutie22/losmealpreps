export type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

// 8oz protein auto-fill from 6oz — admin can override any field after.
export function scaleProteinMacros(sixOz: Macros): Macros {
  const f = 8 / 6;
  return {
    calories:  Math.round(sixOz.calories * f),
    protein_g: round1(sixOz.protein_g * f),
    carbs_g:   round1(sixOz.carbs_g * f),
    fat_g:     round1(sixOz.fat_g * f),
  };
}

// 8oz side-sauce auto-fill from 2oz — admin can override any field after.
export function scaleSauceMacros(twoOz: Macros): Macros {
  const f = 4;
  return {
    calories:  Math.round(twoOz.calories * f),
    protein_g: round1(twoOz.protein_g * f),
    carbs_g:   round1(twoOz.carbs_g * f),
    fat_g:     round1(twoOz.fat_g * f),
  };
}

export function sumCustomMealMacros(parts: Macros[]): Macros {
  const sum = parts.reduce(
    (acc, m) => ({
      calories:  acc.calories  + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g:   acc.carbs_g   + m.carbs_g,
      fat_g:     acc.fat_g     + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  return {
    calories:  Math.round(sum.calories),
    protein_g: round1(sum.protein_g),
    carbs_g:   round1(sum.carbs_g),
    fat_g:     round1(sum.fat_g),
  };
}
