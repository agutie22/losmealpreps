import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { BundleTier, Meal } from '@/stores/cartStore';
import { fetchActiveMeals, fetchActiveBundles } from '@/lib/queries/public';
import type { Bundle } from '@/lib/queries/public';
import MealSelector from './MealSelector';
import SlotManager from './SlotManager';
import OrderSummary from './OrderSummary';

function BundleBuilderInner({ meals, bundles }: { meals: Meal[]; bundles: Bundle[] }) {
  const { activeTier, setTier, slots } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const urlTier = params.get('tier') as BundleTier | null;
    const currentTier = useCartStore.getState().activeTier;

    if (!currentTier || urlTier) {
      const targetTier = urlTier || 'standard';
      const bundle = bundles.find(b => b.tier === targetTier) || bundles[0];
      if (bundle) {
        setTier(bundle.tier as BundleTier, bundle.slot_count);
        if (urlTier) window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      const bundle = bundles.find(b => b.tier === currentTier);
      if (bundle) setTier(bundle.tier as BundleTier, bundle.slot_count);
    }
  }, [bundles, setTier]);

  useEffect(() => {
    if (!mobileSummaryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSummaryOpen(false);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileSummaryOpen]);

  if (!isMounted) return <div className="min-h-screen bg-[var(--color-surface-base)]" />;

  const activeBundle = bundles.find(b => b.tier === activeTier);
  if (!activeBundle) return null;
  const selectedCount = slots.filter((slot) => slot !== null).length;
  const remainingCount = Math.max(activeBundle.slot_count - selectedCount, 0);
  const isComplete = remainingCount === 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] bg-[var(--color-surface-base)] pb-24 lg:pb-0">
      <div className="flex-1 lg:max-w-[70%] p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] text-[var(--color-fg)]">
            Build Your {activeBundle.display_name}
          </h1>
          <p className="text-[16px] text-[var(--color-fg-muted)] mt-2">
            Select {activeBundle.slot_count} meals to complete your bundle.
          </p>
        </div>
        <MealSelector meals={meals} />
      </div>

      <div className="hidden lg:block w-full lg:w-[30%] lg:min-w-[380px] bg-[var(--color-surface-sunken)] border-t lg:border-t-0 lg:border-l border-[var(--color-surface-sunken)]">
        <div className="lg:sticky lg:top-[72px] h-auto lg:h-[calc(100vh-72px)] flex flex-col">
          <SlotManager />
          <div className="p-4 lg:p-6 bg-[var(--color-surface-elevated)] border-t border-[var(--color-surface-sunken)] lg:mt-0 lg:flex-1 flex flex-col justify-end">
            <OrderSummary bundle={activeBundle} />
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-rail)]">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(true)}
          className="w-full px-4 py-3 flex items-center justify-between gap-4"
          aria-expanded={mobileSummaryOpen}
          aria-controls="mobile-bundle-sheet"
        >
          <div className="text-left">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">Your Bundle</p>
            <p className="text-[14px] font-medium text-[var(--color-fg)]">
              {selectedCount}/{activeBundle.slot_count} selected
              {!isComplete && ` · ${remainingCount} to go`}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--color-brand)] text-white text-[13px] font-semibold">
            Review
          </span>
        </button>
      </div>

      {mobileSummaryOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setMobileSummaryOpen(false)}
          />
          <section
            id="mobile-bundle-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Bundle summary"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-[var(--color-surface-sunken)] rounded-t-[24px] border-t border-[var(--color-surface-sunken)] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 bg-[var(--color-surface-elevated)] border-b border-[var(--color-surface-sunken)] flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-fg-muted)]">Your Bundle</p>
                <p className="text-[14px] font-medium text-[var(--color-fg)]">{selectedCount}/{activeBundle.slot_count} selected</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-fg)] transition-colors"
                aria-label="Close bundle summary"
              >
                X
              </button>
            </div>
            <SlotManager />
            <div className="p-4 bg-[var(--color-surface-elevated)] border-t border-[var(--color-surface-sunken)]">
              <OrderSummary bundle={activeBundle} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function BundleBuilder() {
  const [data, setData] = useState<{ meals: Meal[]; bundles: Bundle[] } | null>(null);

  useEffect(() => {
    Promise.all([fetchActiveMeals(), fetchActiveBundles()])
      .then(([meals, bundles]) => {
        setData({ meals, bundles });
      })
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[var(--color-surface-base)] flex items-center justify-center px-4 sm:px-6">
        <div className="text-[var(--color-fg-muted)] text-[16px]">Loading menu…</div>
      </div>
    );
  }

  return <BundleBuilderInner {...data} />;
}
