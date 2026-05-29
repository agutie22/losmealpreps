import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/pricing';

interface SauceAddon {
  id: string;
  name: string;
  upcharge_cents: number;
}

export default function CartAddonsUpsell() {
  const [sauces, setSauces] = useState<SauceAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const addAddonItem = useCartStore((state) => state.addAddonItem);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSauces() {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, upcharge_cents')
        .eq('type', 'sauce')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!error && data) {
        setSauces(data);
      }
      setLoading(false);
    }
    fetchSauces();
  }, []);

  if (loading || sauces.length === 0) return null;

  const handleAdd = (sauce: SauceAddon) => {
    addAddonItem({
      id: sauce.id,
      name: sauce.name,
      priceCents: sauce.upcharge_cents || 150, // default if not set
    });
    setAddedId(sauce.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-surface-sunken)]">
      <h3 className="text-[13px] font-semibold text-[var(--color-fg)] mb-3">Add some extras?</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {sauces.map((sauce) => (
          <div key={sauce.id} className="min-w-[120px] snap-start bg-[var(--color-surface-base)] rounded-[var(--radius-card)] p-3 shadow-sm border border-[var(--color-surface-sunken)] flex flex-col justify-between">
            <div>
              <p className="font-semibold text-[13px] text-[var(--color-fg)] leading-tight">{sauce.name}</p>
              <p className="text-[12px] text-[var(--color-brand)] mt-1">{formatPrice(sauce.upcharge_cents || 150)}</p>
            </div>
            <button
              type="button"
              onClick={() => handleAdd(sauce)}
              className="mt-3 w-full text-[12px] font-medium py-1.5 rounded-[var(--radius-pill)] border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white transition-colors"
            >
              {addedId === sauce.id ? 'Added!' : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
