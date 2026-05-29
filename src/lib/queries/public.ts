import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { BundleWithOptions, BundleWithOptionsRow } from '@/lib/bundles';
import { mapBundleWithOptions } from '@/lib/bundles';
import { SETTINGS_DEFAULTS } from '@/lib/queries/settings';

export type Meal = Database['public']['Tables']['meals']['Row'];
export type { Bundle, BundleWithOptions } from '@/lib/bundles';
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

export async function fetchActiveMeals(): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchActiveBundles(): Promise<BundleWithOptions[]> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*, bundle_slot_options(*, bundle_protein_sizes(*))')
    .eq('is_active', true)
    .order('slug', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapBundleWithOptions(row as BundleWithOptionsRow));
}

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) throw error;
  return (data ?? []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), { ...SETTINGS_DEFAULTS } as Record<string, string>);
}

export async function fetchCustomLineData(): Promise<CustomLineData> {
  const [{ data: ings, error: e1 }, { data: vars, error: e2 }, { data: cfg, error: e3 }] =
    await Promise.all([
      supabase.from('ingredients').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      supabase.from('ingredient_variants').select('*').order('display_order', { ascending: true }),
      supabase.from('custom_meal_config').select('*').eq('id', 1).single(),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  const varByIng = (vars ?? []).reduce(
    (acc, v) => { (acc[v.ingredient_id] ??= []).push(v); return acc; },
    {} as Record<string, IngredientVariant[]>,
  );
  const withVars = (i: Ingredient): IngredientWithVariants => ({ ...i, variants: varByIng[i.id] ?? [] });

  return {
    proteins:   (ings ?? []).filter(i => i.type === 'protein').map(withVars),
    carbs:      (ings ?? []).filter(i => i.type === 'carb'),
    veggies:    (ings ?? []).filter(i => i.type === 'veggie'),
    sideSauces: (ings ?? []).filter(i => i.type === 'sauce' && i.available_as_side).map(withVars),
    flavors:    (ings ?? []).filter(i => i.type === 'flavor'),
    config: cfg!,
  };
}
