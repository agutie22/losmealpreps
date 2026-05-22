import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/types/database.types';

export type BundleTier = 'standard' | 'premium';
export type Meal = Database['public']['Tables']['meals']['Row'];

export interface CustomBuildSummary {
  proteinName: string;
  proteinSize: string;
  proteinPriceCents: number;
  carbName: string | null;
  carbUpchargeCents: number;
  veggieNames: string[];
  sauceNames: string[];
  flavorName: string | null;
  sideSauceName: string | null;
  sideSauceSize: string | null;
  sideSaucePriceCents: number;
  totalCents: number;
  macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  selection?: {
    proteinId: string;
    proteinVariantId: string | null;
    carbId: string | null;
    veggieIds: string[];
    flavorId: string | null;
    sideSauceId: string | null;
    sideSauceVariantId: string | null;
  };
}

export interface BundleCartSummary {
  bundleId?: string;
  bundleName: string;
  slotCount: number;
  totalCents: number;
  mealNames: string[];
}

export type CartItem =
  | { kind: 'meal';   cartId: string; meal: Meal }
  | { kind: 'custom'; cartId: string; build: CustomBuildSummary }
  | { kind: 'bundle'; cartId: string; bundle: BundleCartSummary };

interface CartState {
  // Bundle builder (existing)
  activeTier: BundleTier | null;
  slots: (Meal | null)[];
  setTier: (tier: BundleTier, maxSlots: number) => void;
  addMeal: (meal: Meal) => void;
  removeMeal: (index: number) => void;
  clearCart: () => void;

  // Individual items (meals + custom builds)
  items: CartItem[];
  addMealItem: (meal: Meal) => void;
  addCustomItem: (build: CustomBuildSummary) => void;
  addBundleItem: (bundle: BundleCartSummary) => void;
  replaceItems: (items: CartItem[]) => void;
  removeItem: (cartId: string) => void;
  clearItems: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      activeTier: null,
      slots: [],
      items: [],

      setTier: (tier, maxSlots) => set((state) => {
        if (state.activeTier === tier && state.slots.length === maxSlots) return state;
        const newSlots = new Array(maxSlots).fill(null);
        const existingMeals = state.slots.filter((m) => m !== null);
        for (let i = 0; i < Math.min(existingMeals.length, maxSlots); i++) {
          newSlots[i] = existingMeals[i];
        }
        return { activeTier: tier, slots: newSlots };
      }),

      addMeal: (meal) => set((state) => {
        if (!state.activeTier) return state;
        const emptyIndex = state.slots.findIndex((m) => m === null);
        if (emptyIndex === -1) return state;
        const newSlots = [...state.slots];
        newSlots[emptyIndex] = meal;
        return { slots: newSlots };
      }),

      removeMeal: (index) => set((state) => {
        const meals = state.slots.filter((_, i) => i !== index && state.slots[i] !== null);
        const compressedSlots = new Array(state.slots.length).fill(null);
        meals.forEach((m, i) => { compressedSlots[i] = m; });
        return { slots: compressedSlots };
      }),

      clearCart: () => set((state) => ({ slots: new Array(state.slots.length).fill(null) })),

      addMealItem: (meal) => set((state) => ({
        items: [...state.items, { kind: 'meal', cartId: crypto.randomUUID(), meal }],
      })),

      addCustomItem: (build) => set((state) => ({
        items: [...state.items, { kind: 'custom', cartId: crypto.randomUUID(), build }],
      })),

      addBundleItem: (bundle) => set((state) => ({
        items: [...state.items, { kind: 'bundle', cartId: crypto.randomUUID(), bundle }],
      })),

      replaceItems: (items) => set({ items }),

      removeItem: (cartId) => set((state) => ({
        items: state.items.filter(i => i.cartId !== cartId),
      })),

      clearItems: () => set({ items: [] }),
    }),
    { name: 'los-meal-preps-cart' },
  ),
);
