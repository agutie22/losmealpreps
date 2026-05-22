import { supabase } from '@/lib/supabase/client';
import { priceCustomMeal } from '@/lib/pricing';
import type { CartItem } from '@/stores/cartStore';
import type { Database } from '@/types/database.types';

type MealRow = Database['public']['Tables']['meals']['Row'];
type BundleRow = Database['public']['Tables']['bundles']['Row'];
type IngredientRow = Database['public']['Tables']['ingredients']['Row'];
type IngredientVariantRow = Database['public']['Tables']['ingredient_variants']['Row'];

export async function repriceCartItems(items: CartItem[]): Promise<{ items: CartItem[]; hadPriceChanges: boolean }> {
  if (items.length === 0) return { items, hadPriceChanges: false };

  const mealIds = [...new Set(items.filter((i) => i.kind === 'meal').map((i) => i.meal.id))];
  const bundleIds = [...new Set(items.filter((i) => i.kind === 'bundle').map((i) => i.bundle.bundleId).filter(Boolean))] as string[];

  const ingredientIds = new Set<string>();
  const variantIds = new Set<string>();
  items.forEach((item) => {
    if (item.kind !== 'custom' || !item.build.selection) return;
    const s = item.build.selection;
    ingredientIds.add(s.proteinId);
    if (s.carbId) ingredientIds.add(s.carbId);
    if (s.sideSauceId) ingredientIds.add(s.sideSauceId);
    s.veggieIds.forEach((id) => ingredientIds.add(id));
    if (s.flavorId) ingredientIds.add(s.flavorId);
    if (s.proteinVariantId) variantIds.add(s.proteinVariantId);
    if (s.sideSauceVariantId) variantIds.add(s.sideSauceVariantId);
  });

  const [mealsRes, bundlesRes, ingredientsRes, variantsRes] = await Promise.all([
    mealIds.length > 0
      ? supabase.from('meals').select('*').in('id', mealIds)
      : Promise.resolve({ data: [] as MealRow[], error: null }),
    bundleIds.length > 0
      ? supabase.from('bundles').select('*').in('id', bundleIds)
      : Promise.resolve({ data: [] as BundleRow[], error: null }),
    ingredientIds.size > 0
      ? supabase.from('ingredients').select('*').in('id', [...ingredientIds])
      : Promise.resolve({ data: [] as IngredientRow[], error: null }),
    variantIds.size > 0
      ? supabase.from('ingredient_variants').select('*').in('id', [...variantIds])
      : Promise.resolve({ data: [] as IngredientVariantRow[], error: null }),
  ]);

  if (mealsRes.error) throw mealsRes.error;
  if (bundlesRes.error) throw bundlesRes.error;
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (variantsRes.error) throw variantsRes.error;

  const mealById = new Map((mealsRes.data ?? []).map((m) => [m.id, m]));
  const bundleById = new Map((bundlesRes.data ?? []).map((b) => [b.id, b]));
  const ingredientById = new Map((ingredientsRes.data ?? []).map((i) => [i.id, i]));
  const variantById = new Map((variantsRes.data ?? []).map((v) => [v.id, v]));

  let hadPriceChanges = false;
  const repricedItems = items.map((item) => {
    if (item.kind === 'meal') {
      const latest = mealById.get(item.meal.id);
      if (!latest) return item;
      if (latest.base_price_cents !== item.meal.base_price_cents) hadPriceChanges = true;
      return { ...item, meal: latest };
    }

    if (item.kind === 'bundle') {
      if (!item.bundle.bundleId) return item;
      const latest = bundleById.get(item.bundle.bundleId);
      if (!latest) return item;
      if (latest.base_price_cents !== item.bundle.totalCents) hadPriceChanges = true;
      return { ...item, bundle: { ...item.bundle, totalCents: latest.base_price_cents } };
    }

    if (!item.build.selection) return item;
    const s = item.build.selection;
    const proteinVariantPrice = s.proteinVariantId ? (variantById.get(s.proteinVariantId)?.price_cents ?? 0) : 0;
    const carbUpcharge = s.carbId ? (ingredientById.get(s.carbId)?.upcharge_cents ?? 0) : 0;
    const sideSaucePrice = s.sideSauceVariantId ? (variantById.get(s.sideSauceVariantId)?.price_cents ?? 0) : 0;
    const extras: number[] = [];
    if (s.carbId) extras.push(carbUpcharge);
    if (s.sideSauceVariantId) extras.push(sideSaucePrice);
    const totalCents = priceCustomMeal({
      basePriceCents: 0,
      proteinVariantPriceCents: proteinVariantPrice,
      extraUpchargesCents: extras,
    });
    if (totalCents !== item.build.totalCents) hadPriceChanges = true;
    return {
      ...item,
      build: {
        ...item.build,
        proteinPriceCents: proteinVariantPrice,
        carbUpchargeCents: carbUpcharge,
        sideSaucePriceCents: sideSaucePrice,
        totalCents,
      },
    };
  });

  return { items: repricedItems, hadPriceChanges };
}
