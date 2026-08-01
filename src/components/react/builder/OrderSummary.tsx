import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { BundleWithOptions } from '@/lib/bundles';
import { formatPrice } from '@/lib/pricing';

interface OrderSummaryProps {
  bundle: BundleWithOptions;
}

export default function OrderSummary({ bundle }: OrderSummaryProps) {
  const {
    slots,
    activeSlotCount,
    selectedProteinSize,
    addBundleItem,
    clearBuilderSlots,
  } = useCartStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const filledSlots = slots.filter((s) => s !== null);
  const isComplete =
    selectedProteinSize != null &&
    activeSlotCount != null &&
    filledSlots.length === slots.length &&
    slots.length > 0;

  const totalCents = selectedProteinSize?.priceCents ?? 0;

  const handleAddBundleToCart = () => {
    if (!isComplete || !selectedProteinSize || activeSlotCount == null) return;
    addBundleItem({
      bundleId: bundle.id,
      bundleName: bundle.display_name,
      mealType: bundle.meal_type as 'staple' | 'weekly',
      slotCount: activeSlotCount,
      proteinSizeLabel: selectedProteinSize.label,
      totalCents,
      mealNames: filledSlots.map((meal) => meal.name),
    });
    clearBuilderSlots();
    window.dispatchEvent(new CustomEvent('bundle-sheet:close'));
    window.dispatchEvent(new CustomEvent('cart:open:request'));
  };

  if (!isClient) return null;

  return (
    <div>
      {selectedProteinSize && (
        <p className="text-[13px] text-[var(--color-fg-muted)] mb-3">
          {activeSlotCount} meals · {selectedProteinSize.label} protein (all meals)
        </p>
      )}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[16px] font-bold text-[var(--color-fg)]">Total</span>
        <span className="text-[24px] font-[family-name:var(--font-display)] font-bold text-[var(--color-brand)]">
          {selectedProteinSize ? formatPrice(totalCents) : '—'}
        </span>
      </div>

      <button
        onClick={handleAddBundleToCart}
        disabled={!isComplete}
        className={`w-full py-4 rounded-[var(--radius-pill)] font-semibold text-[16px] transition-colors flex items-center justify-center gap-2 ${
          isComplete
            ? 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)] shadow-md cursor-pointer'
            : 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)] cursor-not-allowed'
        }`}
      >
        {isComplete ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Add Bundle to Cart
          </>
        ) : (
          !selectedProteinSize
            ? 'Choose meal count and protein size'
            : `Select ${slots.length - filledSlots.length} more meals`
        )}
      </button>

      {isComplete && (
        <p className="text-center text-[12px] text-[var(--color-fg-muted)] mt-3">
          Add your bundle, then send your full order from the cart.
        </p>
      )}
    </div>
  );
}
