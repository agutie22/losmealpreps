import React, { useMemo } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { Meal } from '@/stores/cartStore';

interface MealSelectorProps {
  meals: Meal[];
}

export default function MealSelector({ meals }: MealSelectorProps) {
  const { addMeal, slots } = useCartStore();
  const selectedCounts = useMemo(
    () =>
      slots.reduce((acc, slot) => {
        if (!slot) return acc;
        acc[slot.id] = (acc[slot.id] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [slots],
  );

  const handleAdd = (meal: Meal) => {
    addMeal(meal);
  };

  const isFull = slots.every(s => s !== null);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
      {meals.map((meal) => (
        <div key={meal.id} className="group flex flex-col bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out-soft)]">
          <div className="relative h-40 md:h-48 w-full bg-[var(--color-surface-sunken)] overflow-hidden">
            {meal.hero_image_url && (
              <img 
                src={meal.hero_image_url} 
                alt={meal.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)]"
                loading="lazy"
              />
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-tag)] text-[11px] font-semibold tracking-wide uppercase bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] shadow-sm">
                {meal.category}
              </span>
            </div>
            {(selectedCounts[meal.id] ?? 0) > 0 && (
              <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[var(--color-brand)] text-white text-[12px] font-bold shadow-sm">
                {selectedCounts[meal.id]}x
              </span>
            )}
          </div>
          
          <div className="p-4 md:p-5 flex flex-col flex-1">
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-[17px] md:text-[18px] text-[var(--color-fg)] leading-tight mb-2">
              {meal.name}
            </h3>
            <p className="text-[var(--color-fg-muted)] text-[13px] md:text-[14px] line-clamp-2 mb-3 md:mb-4 flex-1">
              {meal.description}
            </p>
            
            <button
              onClick={() => handleAdd(meal)}
              disabled={isFull}
              className={`w-full py-2.5 rounded-[var(--radius-pill)] font-semibold text-[13px] md:text-[14px] transition-colors flex items-center justify-center gap-2 ${
                isFull 
                  ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)] cursor-not-allowed'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-[var(--color-surface-elevated)] cursor-pointer'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {(selectedCounts[meal.id] ?? 0) > 0 ? 'Add Again' : 'Add to Bundle'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
