import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { Bundle } from '@/lib/queries/bundles';
import { formatPrice } from '@/lib/pricing';

interface OrderSummaryProps {
  bundle: Bundle;
}

export default function OrderSummary({ bundle }: OrderSummaryProps) {
  const { slots, addBundleItem, clearCart } = useCartStore();
  const [isClient, setIsClient] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filledSlots = slots.filter(s => s !== null);
  const isComplete = filledSlots.length === slots.length;

  const handleAddBundleToCart = () => {
    if (!isComplete) return;
    addBundleItem({
      bundleId: bundle.id,
      bundleName: bundle.display_name,
      slotCount: slots.length,
      totalCents: bundle.base_price_cents,
      mealNames: filledSlots.map((meal) => meal.name),
    });
    clearCart();
    setToastMessage('Bundle added to cart. Keep shopping or send from your cart.');
  };

  if (!isClient) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[16px] font-bold text-[var(--color-fg)]">Total</span>
        <span className="text-[24px] font-[family-name:var(--font-display)] font-bold text-[var(--color-brand)]">
          {formatPrice(bundle.base_price_cents)}
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
          `Select ${slots.length - filledSlots.length} more meals`
        )}
      </button>
      
      {isComplete && (
        <p className="text-center text-[12px] text-[var(--color-fg-muted)] mt-3">
          Add your bundle, then send your full order from the cart.
        </p>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-[140] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[13px] text-[var(--color-fg)] shadow-[var(--shadow-rail)]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
