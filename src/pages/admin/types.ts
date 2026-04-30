export type MealRow = {
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    is_active: boolean;
    display_order: number;
    ingredient_ids: string[];
};

export type IngredientRow = {
    id: string;
    name: string;
    category: 'protein' | 'carb' | 'veggie' | 'sauce';
    price: number;
    price_large: number | null;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    protein_large: number | null;
    carbs_large: number | null;
    fat_large: number | null;
    calories_large: number | null;
    is_premium: boolean;
    is_active: boolean;
    display_order: number;
};

export type BundleDealRow = {
    variant: 'standard' | 'premium';
    title: string;
    subtitle: string;
    meal_count: number;
    price: number;
    image: string;
    is_active: boolean;
};

export type BundleProteinMap = Record<'standard' | 'premium', string[]>;

export type MealDraft = {
    title: string;
    description: string;
    image: string;
    price: number;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    is_active: boolean;
    nutritionOverride: boolean;
    ingredient_ids: string[];
};
