import { CARBS, PROTEINS, SAUCES, VEGGIES } from './ingredients';
import { meals } from './meals';
import type { MenuData } from '../types/menu';

export const defaultMenuData: MenuData = {
    meals,
    proteins: PROTEINS,
    carbs: CARBS,
    veggies: VEGGIES,
    sauces: SAUCES,
    bundles: {
        standard: {
            variant: 'standard',
            title: '10 MEAL BUNDLE DEAL',
            subtitle: '10 MEALS (6OZ) ONLY $115',
            mealCount: 10,
            price: 115,
            image: '',
            isActive: true,
            allowedProteinIds: ['p2', 'p3', 'p5', 'p_tilapia']
        },
        premium: {
            variant: 'premium',
            title: 'PREMIUM BUNDLE DEAL',
            subtitle: '10 MEALS (6OZ) ONLY $150',
            mealCount: 10,
            price: 150,
            image: '',
            isActive: true,
            allowedProteinIds: ['p1', 'p4', 'p_ribeye', 'p_shrimp', 'p_salmon', 'p_bulgogi']
        }
    }
};
