import React, { useEffect, useState } from 'react';
import { fetchActiveBundles, type BundleWithOptions } from '@/lib/queries/public';
import { formatPrice, getMinBundlePrice } from '@/lib/pricing';
import { getDefaultSlotOption } from '@/lib/bundles';

function BundleCard({ bundle }: { bundle: BundleWithOptions }) {
  const isWeekly = bundle.meal_type === 'weekly';
  const defaultSlot = getDefaultSlotOption(bundle);
  const minPrice = getMinBundlePrice(bundle);

  return (
    <div
      className={`relative flex flex-col p-6 sm:p-8 rounded-[var(--radius-card)] border-2 ${
        isWeekly
          ? 'border-[var(--color-brand)] bg-[var(--color-surface-base)] shadow-[var(--shadow-rail)]'
          : 'border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)]'
      }`}
    >
      {isWeekly && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-[var(--color-brand)] text-[var(--color-surface-elevated)] text-[12px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
            Chef&apos;s picks
          </span>
        </div>
      )}

      <div className="text-center mb-6 sm:mb-8">
        <h3 className="font-[family-name:var(--font-display)] font-bold text-[24px] sm:text-[28px] text-[var(--color-fg)] mb-2">
          {bundle.display_name}
        </h3>
        {bundle.tagline && (
          <p className="text-[var(--color-fg-muted)] text-[15px] sm:text-[16px]">{bundle.tagline}</p>
        )}
      </div>

      <div className="flex items-end justify-center gap-1 mb-6 sm:mb-8">
        <span className="text-[36px] sm:text-[40px] font-bold text-[var(--color-brand)] leading-none">
          from {formatPrice(minPrice)}
        </span>
        {defaultSlot && (
          <span className="text-[var(--color-fg-subtle)] text-[14px] font-medium mb-1">
            / {defaultSlot.slot_count}+ meals
          </span>
        )}
      </div>

      <div className="space-y-3.5 sm:space-y-4 mb-6 sm:mb-8 flex-1">
        {[
          isWeekly ? 'Rotating weekly chef specials' : 'Always-on signature staples',
          'Choose your protein size for the whole bundle',
          'Macro-tracked portions',
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <svg className="text-[var(--color-brand)] w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[14px] text-[var(--color-fg)]">{feature}</span>
          </div>
        ))}
      </div>

      <a
        href={`/build?bundle=${bundle.slug}`}
        className={`w-full py-3.5 sm:py-4 rounded-[var(--radius-pill)] font-semibold text-[15px] sm:text-[16px] text-center transition-colors block ${
          isWeekly
            ? 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'
            : 'bg-[var(--color-surface-sunken)] text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]'
        }`}
      >
        Build {isWeekly ? 'Weekly' : 'Staple'} Bundle
      </a>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col p-6 sm:p-8 rounded-[var(--radius-card)] border-2 border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)] animate-pulse">
      <div className="h-8 bg-[var(--color-surface-sunken)] rounded w-1/2 mx-auto mb-4" />
      <div className="h-12 bg-[var(--color-surface-sunken)] rounded w-1/3 mx-auto mb-8" />
      <div className="space-y-3 mb-8">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-[var(--color-surface-sunken)] rounded" />)}
      </div>
      <div className="h-12 bg-[var(--color-surface-sunken)] rounded-[var(--radius-pill)]" />
    </div>
  );
}

export default function BundlesSection() {
  const [bundles, setBundles] = useState<BundleWithOptions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBundles()
      .then(setBundles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
        <SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-fg-muted)]">
        <p className="text-[18px]">Bundle plans coming soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
      {bundles.map((bundle) => <BundleCard key={bundle.id} bundle={bundle} />)}
    </div>
  );
}
