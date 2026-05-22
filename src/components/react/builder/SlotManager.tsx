import React from 'react';
import { useCartStore } from '@/stores/cartStore';

export default function SlotManager() {
  const { slots, removeMeal } = useCartStore();

  const filledSlotsCount = slots.filter(s => s !== null).length;
  const isFull = filledSlotsCount === slots.length;

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-h-[42vh] lg:max-h-none custom-scrollbar">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-bold text-[24px] text-[var(--color-fg)] leading-tight">
            Your Bundle
          </h2>
          <p className="text-[14px] text-[var(--color-fg-muted)] mt-1">
            {filledSlotsCount} / {slots.length} Meals Selected
          </p>
        </div>
        
        {isFull && (
          <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius-tag)] text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
            Complete
          </span>
        )}
      </div>

      <div className="space-y-3">
        {slots.map((meal, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-3 p-3 rounded-[var(--radius-input)] border transition-colors ${
              meal 
                ? 'bg-[var(--color-surface-elevated)] border-[var(--color-surface-sunken)] shadow-sm' 
                : 'bg-transparent border-dashed border-[var(--color-fg-muted)]/30'
            }`}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)]">
              {index + 1}
            </div>
            
            {meal ? (
              <>
                {meal.hero_image_url ? (
                  <img src={meal.hero_image_url} alt={meal.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[var(--color-surface-sunken)] flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[var(--color-fg)] truncate">
                    {meal.name}
                  </p>
                </div>
                
                <button 
                  onClick={() => removeMeal(index)}
                  className="p-2 text-[var(--color-fg-muted)] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                  aria-label="Remove meal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </>
            ) : (
              <div className="flex-1 py-2">
                <p className="text-[14px] text-[var(--color-fg-muted)] italic">Empty Slot</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
