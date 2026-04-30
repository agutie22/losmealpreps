import { n, nint, nOrNull } from './dbNumeric';
import type { BundleDealRow, IngredientRow, MealRow } from '../pages/admin/types';

export function normalizeMealItemRow(row: Record<string, unknown>): MealRow {
    return {
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        image: String(row.image ?? ''),
        price: n(row.price),
        protein: n(row.protein),
        carbs: n(row.carbs),
        fat: n(row.fat),
        calories: n(row.calories),
        is_active: Boolean(row.is_active),
        display_order: nint(row.display_order, 0),
        ingredient_ids: Array.isArray(row.ingredient_ids) ? (row.ingredient_ids as string[]) : []
    };
}

export function normalizeIngredientRow(row: Record<string, unknown>): IngredientRow {
    return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        category: row.category as IngredientRow['category'],
        price: n(row.price),
        price_large: nOrNull(row.price_large),
        protein: n(row.protein),
        carbs: n(row.carbs),
        fat: n(row.fat),
        calories: n(row.calories),
        protein_large: nOrNull(row.protein_large),
        carbs_large: nOrNull(row.carbs_large),
        fat_large: nOrNull(row.fat_large),
        calories_large: nOrNull(row.calories_large),
        is_premium: Boolean(row.is_premium),
        is_active: Boolean(row.is_active),
        display_order: nint(row.display_order, 0)
    };
}

export function normalizeBundleDealRow(row: Record<string, unknown>): BundleDealRow {
    return {
        variant: row.variant as BundleDealRow['variant'],
        title: String(row.title ?? ''),
        subtitle: String(row.subtitle ?? ''),
        meal_count: nint(row.meal_count, 1),
        price: n(row.price),
        image: String(row.image ?? ''),
        is_active: Boolean(row.is_active)
    };
}
