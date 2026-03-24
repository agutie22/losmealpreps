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
    priceLarge: number; // Price for 8oz
    macrosLarge: Macronutrients; // Macros for 8oz
}

export interface ProteinOption extends Ingredient {
    category: 'protein';
    priceLarge: number; // Price for 8oz
    macrosLarge: Macronutrients; // Macros for 8oz
}

export const PROTEINS: ProteinOption[] = [
    {
        id: 'p1',
        name: 'Cowboy Butter Tri Tip Steak',
        price: 16,
        priceLarge: 19,
        category: 'protein',
        isPremium: true,
        macros: { protein: 36, fat: 15, calories: 291, carbs: 0 },
        macrosLarge: { protein: 48, fat: 21, calories: 389, carbs: 0 }
    },
    {
        id: 'p_ribeye',
        name: 'Ribeye Steak',
        price: 18,
        priceLarge: 22,
        category: 'protein',
        isPremium: true,
        macros: { protein: 46, fat: 20, calories: 380, carbs: 0 },
        macrosLarge: { protein: 61, fat: 27, calories: 507, carbs: 0 }
    },
    {
        id: 'p_shrimp',
        name: 'Garlic Butter Shrimp',
        price: 16,
        priceLarge: 19,
        category: 'protein',
        isPremium: true,
        macros: { protein: 35, fat: 3, calories: 180, carbs: 0 },
        macrosLarge: { protein: 46, fat: 4, calories: 240, carbs: 0 } // Assuming 0 carbs for shrimp, though glaze might add some? "Garlic Butter" usually low carb.
    },
    {
        id: 'p_salmon',
        name: 'Honey Glazed Salmon',
        price: 17,
        priceLarge: 21,
        category: 'protein',
        isPremium: true,
        macros: { protein: 32, fat: 17, calories: 295, carbs: 5 }, // Honey glaze adds carbs
        macrosLarge: { protein: 43, fat: 23, calories: 393, carbs: 7 }
    },
    {
        id: 'p2',
        name: 'Chipotle Style Chicken Breast',
        price: 13,
        priceLarge: 16,
        category: 'protein',
        macros: { protein: 37, fat: 4, calories: 195, carbs: 0 },
        macrosLarge: { protein: 50, fat: 6, calories: 260, carbs: 0 }
    },
    {
        id: 'p3',
        name: 'Marinated Chicken Thigh',
        price: 10,
        priceLarge: 13,
        category: 'protein',
        macros: { protein: 33, fat: 7, calories: 210, carbs: 0 },
        macrosLarge: { protein: 44, fat: 9, calories: 280, carbs: 0 }
    },
    {
        id: 'p4',
        name: 'Seasoned Ground Beef',
        price: 15,
        priceLarge: 18,
        category: 'protein',
        isPremium: true,
        macros: { protein: 46, fat: 16, calories: 340, carbs: 0 },
        macrosLarge: { protein: 61, fat: 21, calories: 453, carbs: 0 }
    },
    {
        id: 'p5',
        name: 'Serrano Ground Turkey',
        price: 13,
        priceLarge: 16,
        category: 'protein',
        macros: { protein: 38, fat: 15, calories: 309, carbs: 0 },
        macrosLarge: { protein: 51, fat: 19, calories: 412, carbs: 0 }
    },
    {
        id: 'p_tilapia',
        name: 'Golden Lemon Tilapia',
        price: 9,
        priceLarge: 11,
        category: 'protein',
        macros: { protein: 44, fat: 4, calories: 212, carbs: 0 },
        macrosLarge: { protein: 58, fat: 5, calories: 285, carbs: 0 }
    },
    {
        id: 'p_bulgogi',
        name: 'Korean BBQ Bulgogi Beef',
        price: 13,
        priceLarge: 15,
        category: 'protein',
        macros: { protein: 45, fat: 20, calories: 440, carbs: 20 },
        macrosLarge: { protein: 60, fat: 27, calories: 587, carbs: 27 }
    },
];

export const CARBS: Ingredient[] = [
    {
        id: 'c1',
        name: 'Cilantro Lime White Rice',
        price: 0,
        category: 'carb',
        macros: { protein: 4, carbs: 45, fat: 1, calories: 205 } // Estimated
    },
    {
        id: 'c2',
        name: 'Seasoned Red Potatoes',
        price: 0,
        category: 'carb',
        macros: { protein: 3, carbs: 30, fat: 5, calories: 180 } // Estimated
    },
    {
        id: 'c3',
        name: 'No Carb',
        price: 0,
        category: 'carb',
        macros: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    },
];

export const VEGGIES: Ingredient[] = [
    {
        id: 'v1',
        name: 'Mixed Vegetables',
        price: 0,
        category: 'veggie',
        macros: { protein: 2, carbs: 5, fat: 0, calories: 30 } // Estimated
    },
    {
        id: 'v2',
        name: 'No Veggies',
        price: 0,
        category: 'veggie',
        macros: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    },
];

export const SAUCES: SauceOption[] = [
    {
        id: 's0',
        name: 'No Sauce',
        price: 0,
        priceLarge: 0,
        category: 'sauce',
        macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        macrosLarge: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    },
    {
        id: 's1',
        name: 'Chimichurri',
        price: 2,
        priceLarge: 8,
        category: 'sauce',
        macros: { protein: 0.5, carbs: 1, fat: 10, calories: 95 },
        macrosLarge: { protein: 2, carbs: 4, fat: 40, calories: 380 }
    },
    {
        id: 's2',
        name: 'Red Salsa',
        price: 1.5,
        priceLarge: 6,
        category: 'sauce',
        macros: { protein: 0, carbs: 2, fat: 0, calories: 10 },
        macrosLarge: { protein: 1, carbs: 8, fat: 0, calories: 40 }
    },
];
