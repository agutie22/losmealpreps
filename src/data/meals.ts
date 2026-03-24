export interface Meal {
    id: string;
    title: string;
    description: string;
    image: string;
    macros: {
        protein: number; // grams
        carbs: number;   // grams
        fat: number;     // grams
        calories: number; // kcal
    };
    price: number;
}

export const meals: Meal[] = [
    {
        id: '1',
        title: 'Creamy Green Chili Chicken',
        description: 'Grilled chicken breast with our signature creamy poblano sauce and white rice.',
        image: 'https://placehold.co/600x400/D32F2F/FFFFFF?text=Chicken+Breast',
        macros: {
            protein: 40,
            carbs: 35,
            fat: 15,
            calories: 435, // 40*4 + 35*4 + 15*9
        },
        price: 13.99,
    },
    {
        id: '2',
        title: 'Steak & Rice Bowl',
        description: 'Marinated skirt steak served with beans, rice, and salsa.',
        image: 'https://placehold.co/600x400/388E3C/FFFFFF?text=Steak+Bowl',
        macros: {
            protein: 45,
            carbs: 40,
            fat: 20,
            calories: 520, // 45*4 + 40*4 + 20*9
        },
        price: 14.50,
    },
    {
        id: '3',
        title: 'Citrus Shrimp Bowl',
        description: 'Fresh shrimp marinated in lime and chili, served over mixed greens.',
        image: 'https://placehold.co/600x400/FFA000/FFFFFF?text=Shrimp+Bowl',
        macros: {
            protein: 30,
            carbs: 10,
            fat: 10,
            calories: 250, // 30*4 + 10*4 + 10*9
        },
        price: 13.99,
    },
    {
        id: '4',
        title: 'Shredded Beef Burrito',
        description: 'Slow-cooked shredded beef with eggs and peppers in a low-carb tortilla.',
        image: 'https://placehold.co/600x400/5D4037/FFFFFF?text=Beef+Burrito',
        macros: {
            protein: 35,
            carbs: 20,
            fat: 18,
            calories: 382, // 35*4 + 20*4 + 18*9
        },
        price: 11.50,
    },
];
