export interface Macronutrients {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
}

export interface Ingredient {
    id: string;
    name: string;
    price: number;
    category: 'protein' | 'carb' | 'veggie' | 'sauce';
    isPremium?: boolean;
    macros: Macronutrients;
}

export interface SauceOption extends Ingredient {
    category: 'sauce';
    priceLarge: number;
    macrosLarge: Macronutrients;
}

export interface ProteinOption extends Ingredient {
    category: 'protein';
    priceLarge: number;
    macrosLarge: Macronutrients;
}

export interface Meal {
    id: string;
    title: string;
    description: string;
    image: string;
    macros: Macronutrients;
    price: number;
}

export type BundleVariant = 'standard' | 'premium';

export interface BundleDealConfig {
    variant: BundleVariant;
    title: string;
    subtitle: string;
    mealCount: number;
    price: number;
    image: string;
    isActive: boolean;
    allowedProteinIds: string[];
}

export interface MenuData {
    meals: Meal[];
    proteins: ProteinOption[];
    carbs: Ingredient[];
    veggies: Ingredient[];
    sauces: SauceOption[];
    bundles: Record<BundleVariant, BundleDealConfig>;
}
