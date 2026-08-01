import React, { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { Meal } from '@/stores/cartStore';
import { fetchActiveMeals, fetchActiveBundles, type BundleWithOptions } from '@/lib/queries/public';
import {
  getDefaultProteinSize,
  getDefaultSlotOption,
  getSlotOptionByCount,
} from '@/lib/bundles';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import MealSelector from './MealSelector';
import SlotManager from './SlotManager';
import OrderSummary from './OrderSummary';
import BundleConfigPicker from './BundleConfigPicker';

function BundleBuilderInner({ meals, bundles }: { meals: Meal[]; bundles: BundleWithOptions[] }) {
  const {
    activeBundleId,
    activeSlotCount,
    selectedProteinSize,
    slots,
    setBundleConfig,
  } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('bundle');
    const state = useCartStore.getState();

    const targetBundle =
      bundles.find((b) => b.slug === urlSlug) ??
      bundles.find((b) => b.id === state.activeBundleId) ??
      bundles[0];

    if (!targetBundle) return;

    const defaultSlot = getDefaultSlotOption(targetBundle);
    if (!defaultSlot) return;

    const slotCount =
      state.activeBundleId === targetBundle.id && state.activeSlotCount != null
        ? state.activeSlotCount
        : defaultSlot.slot_count;

    const slotOption = getSlotOptionByCount(targetBundle, slotCount) ?? defaultSlot;
    const defaultSize = getDefaultProteinSize(slotOption);
    const proteinSize =
      state.activeBundleId === targetBundle.id && state.selectedProteinSize
        ? state.selectedProteinSize
        : defaultSize
          ? { label: defaultSize.size_label, priceCents: defaultSize.price_cents }
          : null;

    const preserveMeals =
      state.activeBundleId === targetBundle.id &&
      state.activeSlotCount === slotCount &&
      !urlSlug;

    setBundleConfig(targetBundle.id, slotCount, proteinSize, { preserveMeals });

    if (urlSlug) window.history.replaceState({}, '', window.location.pathname);
  }, [bundles, setBundleConfig]);

  useEffect(() => {
    const closeSheet = () => setMobileSummaryOpen(false);
    window.addEventListener('bundle-sheet:close', closeSheet);
    window.addEventListener('cart:open', closeSheet);
    return () => {
      window.removeEventListener('bundle-sheet:close', closeSheet);
      window.removeEventListener('cart:open', closeSheet);
    };
  }, []);

  useEffect(() => {
    if (!mobileSummaryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSummaryOpen(false);
    };
    lockBodyScroll();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileSummaryOpen]);

  const activeBundle = bundles.find((b) => b.id === activeBundleId);
  const filteredMeals = useMemo(
    () =>
      activeBundle
        ? meals.filter((m) => m.meal_type === activeBundle.meal_type)
        : [],
    [meals, activeBundle],
  );

  const configReady = Boolean(
    activeBundle && activeSlotCount != null && selectedProteinSize != null,
  );

  if (!isMounted) return <div className="min-h-screen bg-[var(--color-surface-base)]" />;

  if (!activeBundle) return null;

  const selectedCount = slots.filter((slot) => slot !== null).length;
  const slotTotal = activeSlotCount ?? slots.length;
  const remainingCount = Math.max(slotTotal - selectedCount, 0);
  const isComplete = configReady && remainingCount === 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-72px)] bg-[var(--color-surface-base)] pb-24 lg:pb-0">
      <div className="flex-1 lg:max-w-[70%] p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[32px] md:text-[40px] text-[var(--color-fg)]">
            Build Your {activeBundle.display_name}
          </h1>
          <p className="text-[16px] text-[var(--color-fg-muted)] mt-2">
            {activeBundle.meal_type === 'weekly'
              ? 'Pick from this week’s rotating chef specials.'
              : 'Pick from our always-available staple meals.'}
          </p>
        </div>

        {bundles.length > 1 && (
          <div className="mb-6 grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
            {bundles.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  const slot = getDefaultSlotOption(b);
                  if (!slot) return;
                  const size = getDefaultProteinSize(slot);
                  setBundleConfig(
                    b.id,
                    slot.slot_count,
                    size
                      ? { label: size.size_label, priceCents: size.price_cents }
                      : null,
                  );
                }}
                className={`px-4 py-3 md:py-2.5 rounded-[var(--radius-pill)] text-[14px] md:text-[15px] font-semibold transition-colors flex items-center justify-center ${
                  b.id === activeBundle.id
                    ? 'bg-[var(--color-brand)] text-white shadow-md'
                    : 'bg-[var(--color-surface-elevated)] border border-[var(--color-surface-sunken)] text-[var(--color-fg)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
                }`}
              >
                {b.meal_type === 'weekly' ? 'Weekly Menu' : 'Staple Menu'}
              </button>
            ))}
          </div>
        )}

        <BundleConfigPicker bundle={activeBundle} />

        {configReady ? (
          <>
            <p className="text-[15px] text-[var(--color-fg-muted)] mb-4">
              Select {slotTotal} meals at {selectedProteinSize!.label} protein.
            </p>
            <MealSelector meals={filteredMeals} />
          </>
        ) : (
          <p className="text-[15px] text-[var(--color-fg-subtle)]">
            Choose your meal count and protein size to start selecting meals.
          </p>
        )}
      </div>

      <div className="hidden lg:block w-full lg:w-[30%] lg:min-w-[380px] bg-[var(--color-surface-sunken)] border-t lg:border-t-0 lg:border-l border-[var(--color-surface-sunken)]">
        <div className="lg:sticky lg:top-[72px] h-auto lg:h-[calc(100dvh-72px)] flex flex-col">
          <SlotManager />
          <div className="p-4 lg:p-6 bg-[var(--color-surface-elevated)] border-t border-[var(--color-surface-sunken)] lg:mt-0 lg:flex-1 flex flex-col justify-end">
            <OrderSummary bundle={activeBundle} />
          </div>
        </div>
      </div>

      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-rail)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(true)}
          className="w-full px-4 py-3 min-h-[52px] flex items-center justify-between gap-4"
          aria-expanded={mobileSummaryOpen}
          aria-controls="mobile-bundle-sheet"
        >
          <div className="text-left">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">Your Bundle</p>
            <p className="text-[14px] font-medium text-[var(--color-fg)]">
              {configReady
                ? `${selectedCount}/${slotTotal} selected${!isComplete ? ` · ${remainingCount} to go` : ''}`
                : 'Choose size options'}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--color-brand)] text-white text-[13px] font-semibold">
            Review
          </span>
        </button>
      </div>

      {mobileSummaryOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
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
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] bg-[var(--color-surface-sunken)] rounded-t-[24px] border-t border-[var(--color-surface-sunken)] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 bg-[var(--color-surface-elevated)] border-b border-[var(--color-surface-sunken)] flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-fg-muted)]">Your Bundle</p>
                <p className="text-[14px] font-medium text-[var(--color-fg)]">
                  {configReady ? `${selectedCount}/${slotTotal} selected` : 'Configure bundle'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="h-11 w-11 inline-flex items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-fg)] transition-colors"
                aria-label="Close bundle summary"
              >
                X
              </button>
            </div>
            <SlotManager />
            <div
              className="p-4 bg-[var(--color-surface-elevated)] border-t border-[var(--color-surface-sunken)]"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <OrderSummary bundle={activeBundle} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function BundleBuilder() {
  const [data, setData] = useState<{ meals: Meal[]; bundles: BundleWithOptions[] } | null>(null);

  useEffect(() => {
    Promise.all([fetchActiveMeals(), fetchActiveBundles()])
      .then(([meals, bundles]) => {
        setData({ meals, bundles });
      })
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="min-h-[calc(100dvh-72px)] bg-[var(--color-surface-base)] flex items-center justify-center px-4 sm:px-6">
        <div className="text-[var(--color-fg-muted)] text-[16px]">Loading menu…</div>
      </div>
    );
  }

  if (data.bundles.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-72px)] bg-[var(--color-surface-base)] flex items-center justify-center px-4">
        <p className="text-[var(--color-fg-muted)]">Bundles are not available right now.</p>
      </div>
    );
  }

  return <BundleBuilderInner {...data} />;
}
