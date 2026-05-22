import React, { useEffect, useState } from 'react';
import { fetchActiveMeals, type Meal } from '@/lib/queries/public';
import { formatPrice } from '@/lib/pricing';
import { useCartStore } from '@/stores/cartStore';

const MACRO_COLORS = {
  cal:     '#1A1A1A',
  protein: '#A04032',
  carbs:   '#B0762A',
  fat:     '#6B4A2C',
};

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold"
      style={{ backgroundColor: color + '18', color }}
    >
      {text}
    </span>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  const addMealItem = useCartStore((state) => state.addMealItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addMealItem(meal);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="group flex flex-col bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-[var(--duration-base)]">
      <div className="relative h-32 sm:h-56 w-full bg-[var(--color-surface-sunken)] overflow-hidden">
        {meal.hero_image_url && (
          <img
            src={meal.hero_image_url}
            alt={meal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)]"
            loading="lazy"
          />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          {meal.is_featured && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--color-accent)] text-white">
              Popular
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--color-surface-elevated)] text-[var(--color-fg-muted)]">
            {meal.category}
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-6 flex flex-col flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1.5 sm:gap-4">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-[16px] sm:text-[20px] text-[var(--color-fg)] leading-tight">
            {meal.name}
          </h3>
          <span className="font-medium text-[14px] sm:text-[16px] text-[var(--color-brand)] whitespace-nowrap">
            {formatPrice(meal.base_price_cents)}
          </span>
        </div>
        <p className="text-[var(--color-fg-muted)] text-[12px] sm:text-[14px] line-clamp-2 sm:line-clamp-2 mb-4 sm:mb-6 flex-1">
          {meal.description}
        </p>
        {meal.calories > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 pt-2.5 sm:pt-4 border-t border-[var(--color-surface-sunken)]">
            <Pill text={`${meal.calories} cal`} color={MACRO_COLORS.cal} />
            <Pill text={`${meal.protein_g}g protein`} color={MACRO_COLORS.protein} />
            <Pill text={`${meal.carbs_g}g carbs`} color={MACRO_COLORS.carbs} />
            <Pill text={`${meal.fat_g}g fat`} color={MACRO_COLORS.fat} />
          </div>
        )}
        <div className="mt-3 sm:mt-5">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full bg-[var(--color-brand)] text-[var(--color-surface-elevated)] py-2.5 sm:py-3 rounded-[var(--radius-pill)] text-[13px] sm:text-[14px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
          >
            Add to Order
          </button>
          {justAdded && (
            <p className="text-[11px] text-[var(--color-brand)] font-medium text-center mt-2">
              Added to cart.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] animate-pulse">
      <div className="h-56 bg-[var(--color-surface-sunken)]" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-[var(--color-surface-sunken)] rounded w-3/4" />
        <div className="h-4 bg-[var(--color-surface-sunken)] rounded w-full" />
        <div className="h-4 bg-[var(--color-surface-sunken)] rounded w-2/3" />
      </div>
    </div>
  );
}

export default function MealsSection() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveMeals()
      .then(setMeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-fg-muted)]">
        <p className="text-[18px]">Menu coming soon.</p>
        <p className="text-[14px] mt-2">Check back after the next update.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
      {meals.map(meal => <MealCard key={meal.id} meal={meal} />)}
    </div>
  );
}
