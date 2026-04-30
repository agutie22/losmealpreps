import { defaultMenuData } from '../data/defaultMenu';
import { nint } from '../lib/dbNumeric';
import { normalizeBundleDealRow, normalizeIngredientRow, normalizeMealItemRow } from '../lib/normalizeFromSupabase';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { IngredientRow, MealRow } from '../pages/admin/types';
import type { BundleDealConfig, BundleVariant, Ingredient, Macronutrients, Meal, MenuData, ProteinOption, SauceOption } from '../types/menu';

interface BundleDealProteinRow {
    bundle_variant: BundleVariant;
    protein_id: string;
    display_order: number;
}

function toMacros(row: { protein: number; carbs: number; fat: number; calories: number }): Macronutrients {
    return {
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        calories: row.calories
    };
}

function toMeal(row: MealRow): Meal {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        image: row.image,
        price: row.price,
        macros: toMacros(row)
    };
}

function toProtein(row: IngredientRow): ProteinOption {
    return {
        id: row.id,
        name: row.name,
        category: 'protein',
        price: row.price,
        priceLarge: row.price_large ?? row.price,
        isPremium: row.is_premium,
        macros: toMacros(row),
        macrosLarge: {
            protein: row.protein_large ?? row.protein,
            carbs: row.carbs_large ?? row.carbs,
            fat: row.fat_large ?? row.fat,
            calories: row.calories_large ?? row.calories
        }
    };
}

function toSauce(row: IngredientRow): SauceOption {
    return {
        id: row.id,
        name: row.name,
        category: 'sauce',
        price: row.price,
        priceLarge: row.price_large ?? row.price,
        macros: toMacros(row),
        macrosLarge: {
            protein: row.protein_large ?? row.protein,
            carbs: row.carbs_large ?? row.carbs,
            fat: row.fat_large ?? row.fat,
            calories: row.calories_large ?? row.calories
        }
    };
}

function toIngredient(row: IngredientRow): Ingredient {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: row.price,
        isPremium: row.is_premium,
        macros: toMacros(row)
    };
}

export async function getMenuData(): Promise<MenuData> {
    if (!isSupabaseConfigured || !supabase) {
        return defaultMenuData;
    }

    const [mealsResult, ingredientsResult, bundleDealsResult, bundleDealProteinsResult] = await Promise.all([
        supabase
            .from('meal_items')
            .select('id,title,description,image,price,ingredient_ids,protein,carbs,fat,calories,is_active,display_order')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
        supabase
            .from('ingredients')
            .select('id,name,category,price,price_large,protein,carbs,fat,calories,protein_large,carbs_large,fat_large,calories_large,is_premium,is_active,display_order')
            .eq('is_active', true)
            .order('display_order', { ascending: true }),
        supabase
            .from('bundle_deals')
            .select('variant,title,subtitle,meal_count,price,image,is_active')
            .eq('is_active', true),
        supabase
            .from('bundle_deal_proteins')
            .select('bundle_variant,protein_id,display_order')
            .order('display_order', { ascending: true })
    ]);

    if (mealsResult.error) {
        throw mealsResult.error;
    }
    if (ingredientsResult.error) {
        throw ingredientsResult.error;
    }
    if (bundleDealsResult.error) {
        throw bundleDealsResult.error;
    }
    if (bundleDealProteinsResult.error) {
        throw bundleDealProteinsResult.error;
    }

    const mealRows = (mealsResult.data ?? []).map((row) => normalizeMealItemRow(row as Record<string, unknown>));
    const ingredientRows = (ingredientsResult.data ?? []).map((row) => normalizeIngredientRow(row as Record<string, unknown>));
    const bundleDealRows = (bundleDealsResult.data ?? []).map((row) => normalizeBundleDealRow(row as Record<string, unknown>));
    const bundleDealProteinRows = (bundleDealProteinsResult.data ?? []).map((r) => ({
        bundle_variant: r.bundle_variant as BundleVariant,
        protein_id: String(r.protein_id ?? ''),
        display_order: nint(r.display_order, 0)
    })) as BundleDealProteinRow[];

    const proteins = ingredientRows.filter((row) => row.category === 'protein').map(toProtein);
    const carbs = ingredientRows.filter((row) => row.category === 'carb').map(toIngredient);
    const veggies = ingredientRows.filter((row) => row.category === 'veggie').map(toIngredient);
    const sauces = ingredientRows.filter((row) => row.category === 'sauce').map(toSauce);

    const defaultBundles = defaultMenuData.bundles;
    const bundleMap = bundleDealRows.reduce<Record<BundleVariant, BundleDealConfig>>((acc, row) => {
        const allowedProteinIds = bundleDealProteinRows
            .filter((entry) => entry.bundle_variant === row.variant)
            .sort((a, b) => a.display_order - b.display_order)
            .map((entry) => entry.protein_id);

        acc[row.variant] = {
            variant: row.variant,
            title: row.title,
            subtitle: row.subtitle,
            mealCount: row.meal_count,
            price: row.price,
            image: row.image,
            isActive: row.is_active,
            // Must mirror admin `bundle_deal_proteins` exactly (no silent fallback to defaults).
            allowedProteinIds
        };
        return acc;
    }, {} as Record<BundleVariant, BundleDealConfig>);

    return {
        meals: mealRows.map(toMeal),
        proteins: proteins.length > 0 ? proteins : defaultMenuData.proteins,
        carbs: carbs.length > 0 ? carbs : defaultMenuData.carbs,
        veggies: veggies.length > 0 ? veggies : defaultMenuData.veggies,
        sauces: sauces.length > 0 ? sauces : defaultMenuData.sauces,
        bundles: {
            standard: bundleMap.standard ?? defaultBundles.standard,
            premium: bundleMap.premium ?? defaultBundles.premium
        }
    };
}
