import React from 'react';
import type { BundleWithOptions } from '@/lib/bundles';
import {
  getBundlePrice,
  getDefaultProteinSize,
  getSlotOptionByCount,
  sortProteinSizes,
  sortSlotOptions,
} from '@/lib/bundles';
import { formatPrice } from '@/lib/pricing';
import { useCartStore } from '@/stores/cartStore';

interface BundleConfigPickerProps {
  bundle: BundleWithOptions;
}

export default function BundleConfigPicker({ bundle }: BundleConfigPickerProps) {
  const { activeSlotCount, selectedProteinSize, setBundleConfig, setProteinSize } = useCartStore();
  const slotOptions = sortSlotOptions(bundle.slot_options);
  const activeSlot =
    activeSlotCount != null ? getSlotOptionByCount(bundle, activeSlotCount) : undefined;
  const proteinSizes = activeSlot ? sortProteinSizes(activeSlot.protein_sizes) : [];

  const handleSlotSelect = (slotCount: number) => {
    const slot = getSlotOptionByCount(bundle, slotCount);
    if (!slot) return;
    const defaultSize = getDefaultProteinSize(slot);
    setBundleConfig(
      bundle.id,
      slotCount,
      defaultSize
        ? { label: defaultSize.size_label, priceCents: defaultSize.price_cents }
        : null,
    );
  };

  const handleSizeSelect = (sizeLabel: string) => {
    if (!activeSlot) return;
    const price = getBundlePrice(activeSlot, sizeLabel);
    if (price == null) return;
    setProteinSize({ label: sizeLabel, priceCents: price });
  };

  return (
    <div className="space-y-6 mb-8">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">
          How many meals?
        </p>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
          {slotOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSlotSelect(opt.slot_count)}
              className={`px-4 py-3 md:py-2.5 rounded-[var(--radius-pill)] text-[14px] md:text-[15px] font-semibold transition-colors flex items-center justify-center ${
                activeSlotCount === opt.slot_count
                  ? 'bg-[var(--color-brand)] text-white shadow-md'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-fg)] border border-[var(--color-surface-sunken)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
              }`}
            >
              {opt.slot_count} meals
              {opt.label ? ` · ${opt.label}` : ''}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] mb-3">
          Protein size (all meals in this bundle)
        </p>
        {activeSlot == null ? (
          <p className="text-[14px] text-[var(--color-fg-subtle)]">Choose how many meals first.</p>
        ) : proteinSizes.length === 0 ? (
          <p className="text-[14px] text-[var(--color-fg-subtle)]">No sizes configured for this option.</p>
        ) : (
          <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3">
            {proteinSizes.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => handleSizeSelect(size.size_label)}
                className={`px-4 py-3 md:py-2.5 rounded-[var(--radius-pill)] text-[14px] md:text-[15px] font-semibold transition-colors flex items-center justify-between md:justify-center ${
                  selectedProteinSize?.label === size.size_label
                    ? 'bg-[var(--color-brand)] text-white shadow-md'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-fg)] border border-[var(--color-surface-sunken)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
                }`}
              >
                <span>{size.size_label}</span>
                <span className={selectedProteinSize?.label === size.size_label ? 'text-white/90' : 'text-[var(--color-fg-muted)]'}>
                  {formatPrice(size.price_cents)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
