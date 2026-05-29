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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
      {meals.map((meal) => (
        <div key={meal.id} className="group flex flex-row md:flex-col bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out-soft)]">
          <div className="relative w-[120px] shrink-0 md:w-full md:h-48 bg-[var(--color-surface-sunken)] overflow-hidden">
            {meal.hero_image_url && (
              <img 
                src={meal.hero_image_url} 
                alt={meal.name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-soft)]"
                loading="lazy"
              />
            )}
            <div className="absolute top-2 left-2 flex gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-tag)] text-[10px] md:text-[11px] font-semibold tracking-wide uppercase bg-[var(--color-surface-sunken)]/90 backdrop-blur-sm text-[var(--color-fg-muted)] shadow-sm">
                {meal.category}
              </span>
            </div>
            {/* Desktop selected count */}
            <div className="hidden md:block">
              {(selectedCounts[meal.id] ?? 0) > 0 && (
                <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[var(--color-brand)] text-white text-[12px] font-bold shadow-sm">
                  {selectedCounts[meal.id]}x
                </span>
              )}
            </div>
          </div>
          
          <div className="p-3 md:p-5 flex flex-col flex-1 min-w-0 justify-between">
            <div>
              <div className="flex justify-between items-start gap-2 mb-1 md:mb-2">
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-[15px] md:text-[18px] text-[var(--color-fg)] leading-tight truncate md:whitespace-normal">
                  {meal.name}
                </h3>
                {/* Mobile selected count */}
                <div className="md:hidden shrink-0">
                  {(selectedCounts[meal.id] ?? 0) > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--color-brand)] text-white text-[11px] font-bold shadow-sm">
                      {selectedCounts[meal.id]}x
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[var(--color-fg-muted)] text-[12px] md:text-[14px] line-clamp-2 mb-3 md:mb-4">
                {meal.description}
              </p>
            </div>
            
            <button
              onClick={() => handleAdd(meal)}
              disabled={isFull}
              className={`w-full py-2 md:py-2.5 rounded-[var(--radius-pill)] font-semibold text-[12px] md:text-[14px] transition-colors flex items-center justify-center gap-1.5 md:gap-2 mt-auto ${
                isFull 
                  ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)] cursor-not-allowed'
                  : 'bg-[var(--color-surface-sunken)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-[var(--color-surface-elevated)] cursor-pointer'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {(selectedCounts[meal.id] ?? 0) > 0 ? 'Add Again' : 'Add'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
