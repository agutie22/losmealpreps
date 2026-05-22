import { buildClient } from '../supabase/build';
import type { Database } from '@/types/database.types';

export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type IngredientVariant = Database['public']['Tables']['ingredient_variants']['Row'];
export type CustomMealConfig = Database['public']['Tables']['custom_meal_config']['Row'];

export type IngredientWithVariants = Ingredient & { variants: IngredientVariant[] };

export interface CustomLineData {
  proteins: IngredientWithVariants[];
  carbs: Ingredient[];
  veggies: Ingredient[];
  sideSauces: IngredientWithVariants[];
  flavors: Ingredient[];
  config: CustomMealConfig;
}

export async function getActiveCustomLineData(): Promise<CustomLineData> {
  const [{ data: ings, error: e1 }, { data: vars, error: e2 }, { data: cfg, error: e3 }] =
    await Promise.all([
      buildClient
        .from('ingredients')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      buildClient
        .from('ingredient_variants')
        .select('*')
        .order('display_order', { ascending: true }),
      buildClient.from('custom_meal_config').select('*').eq('id', 1).single(),
    ]);

  if (e1) throw new Error(`Failed to fetch ingredients: ${e1.message}`);
  if (e2) throw new Error(`Failed to fetch ingredient variants: ${e2.message}`);
  if (e3) throw new Error(`Failed to fetch custom meal config: ${e3.message}`);

  const varByIng = (vars ?? []).reduce(
    (acc, v) => {
      (acc[v.ingredient_id] ??= []).push(v);
      return acc;
    },
    {} as Record<string, IngredientVariant[]>,
  );

  const withVars = (i: Ingredient): IngredientWithVariants => ({
    ...i,
    variants: varByIng[i.id] ?? [],
  });

  return {
    proteins:   (ings ?? []).filter(i => i.type === 'protein').map(withVars),
    carbs:      (ings ?? []).filter(i => i.type === 'carb'),
    veggies:    (ings ?? []).filter(i => i.type === 'veggie'),
    sideSauces: (ings ?? []).filter(i => i.type === 'sauce' && i.available_as_side).map(withVars),
    flavors:    (ings ?? []).filter(i => i.type === 'flavor'),
    config: cfg!,
  };
}
