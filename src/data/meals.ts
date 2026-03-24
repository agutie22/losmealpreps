export interface Meal {
    id: string;
    title: string;
    description: string;
    image: string;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
        calories: number;
    };
    price: number;
    subscriberPrice: number;
    tags: string[];
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
            calories: 435, 
        },
        price: 12.99,
        subscriberPrice: 10.99,
        tags: ['High Protein', 'Customer Favorite'],
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
            calories: 520,
        },
        price: 14.50,
        subscriberPrice: 12.50,
        tags: ['High Protein', 'Gluten Free'],
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
            calories: 250,
        },
        price: 13.99,
        subscriberPrice: 11.99,
        tags: ['Low Carb', 'Keto Friendly', 'Gluten Free'],
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
            calories: 382,
        },
        price: 11.50,
        subscriberPrice: 9.99,
        tags: ['Breakfast', 'Low Carb'],
    },
];
