export type Macros = { calories: number; protein_g: number; carbs_g: number; fat_g: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

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
