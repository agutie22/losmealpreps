import type { Meal } from '../types/menu';

const warmPlaceholder = (color: string) =>
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;

export const meals: Meal[] = [
    {
        id: '1',
        title: 'Cowboy Butter Tri Tip Steak',
        description: 'Cowboy Butter Tri Tip Steak served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#C0DD97'),
        macros: { protein: 42, carbs: 50, fat: 16, calories: 526 },
        price: 16.00,
    },
    {
        id: '2',
        title: 'Ribeye Steak',
        description: 'Ribeye Steak served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#F0997B'),
        macros: { protein: 52, carbs: 50, fat: 21, calories: 615 },
        price: 18.00,
    },
    {
        id: '3',
        title: 'Garlic Butter Shrimp',
        description: 'Garlic Butter Shrimp served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#FAC775'),
        macros: { protein: 41, carbs: 50, fat: 4, calories: 415 },
        price: 16.00,
    },
    {
        id: '4',
        title: 'Honey Glazed Salmon',
        description: 'Honey Glazed Salmon served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#5DCAA5'),
        macros: { protein: 38, carbs: 55, fat: 18, calories: 530 },
        price: 17.00,
    },
    {
        id: '5',
        title: 'Chipotle Style Chicken Breast',
        description: 'Chipotle Style Chicken Breast served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#C0DD97'),
        macros: { protein: 43, carbs: 50, fat: 5, calories: 430 },
        price: 14.00,
    },
    {
        id: '6',
        title: 'Marinated Chicken Thigh',
        description: 'Marinated Chicken Thigh served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#F0997B'),
        macros: { protein: 39, carbs: 50, fat: 8, calories: 445 },
        price: 10.00,
    },
    {
        id: '7',
        title: 'Seasoned Ground Beef',
        description: 'Seasoned Ground Beef served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#FAC775'),
        macros: { protein: 52, carbs: 50, fat: 17, calories: 575 },
        price: 15.00,
    },
    {
        id: '8',
        title: 'Serrano Ground Turkey',
        description: 'Serrano Ground Turkey served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#5DCAA5'),
        macros: { protein: 44, carbs: 50, fat: 16, calories: 544 },
        price: 13.00,
    },
    {
        id: '9',
        title: 'Golden Lemon Tilapia',
        description: 'Golden Lemon Tilapia served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#C0DD97'),
        macros: { protein: 50, carbs: 50, fat: 5, calories: 447 },
        price: 9.00,
    },
    {
        id: '10',
        title: 'Korean BBQ Bulgogi Beef',
        description: 'Korean BBQ Bulgogi Beef served with Cilantro Lime White Rice and Mixed Vegetables.',
        image: warmPlaceholder('#F0997B'),
        macros: { protein: 51, carbs: 70, fat: 21, calories: 675 },
        price: 13.00,
    },
];
