import type { Database } from '@/types/database.types';

export type Bundle = Database['public']['Tables']['bundles']['Row'];
export type BundleSlotOption = Database['public']['Tables']['bundle_slot_options']['Row'];
export type BundleProteinSize = Database['public']['Tables']['bundle_protein_sizes']['Row'];

export type BundleSlotOptionWithSizes = BundleSlotOption & {
  protein_sizes: BundleProteinSize[];
};

export type BundleWithOptions = Bundle & {
  slot_options: BundleSlotOptionWithSizes[];
};

/** Raw nested shape returned by Supabase select */
export type BundleSlotOptionRow = BundleSlotOption & {
  bundle_protein_sizes: BundleProteinSize[] | null;
};

export type BundleWithOptionsRow = Bundle & {
  bundle_slot_options: BundleSlotOptionRow[] | null;
};

export function mapBundleWithOptions(row: BundleWithOptionsRow): BundleWithOptions {
  const { bundle_slot_options, ...bundle } = row;
  return {
    ...bundle,
    slot_options: sortSlotOptions(
      (bundle_slot_options ?? []).map((opt) => {
        const { bundle_protein_sizes, ...slot } = opt;
        return {
          ...slot,
          protein_sizes: sortProteinSizes(bundle_protein_sizes ?? []),
        };
      }),
    ),
  };
}

export function sortSlotOptions(options: BundleSlotOptionWithSizes[]): BundleSlotOptionWithSizes[] {
  return [...options].sort((a, b) => a.display_order - b.display_order || a.slot_count - b.slot_count);
}

export function sortProteinSizes(sizes: BundleProteinSize[]): BundleProteinSize[] {
  return [...sizes].sort((a, b) => a.display_order - b.display_order || a.size_label.localeCompare(b.size_label));
}

export function getDefaultSlotOption(bundle: BundleWithOptions): BundleSlotOptionWithSizes | undefined {
  const sorted = sortSlotOptions(bundle.slot_options);
  return sorted.find((o) => o.is_default) ?? sorted[0];
}

export function getSlotOptionByCount(
  bundle: BundleWithOptions,
  slotCount: number,
): BundleSlotOptionWithSizes | undefined {
  return bundle.slot_options.find((o) => o.slot_count === slotCount);
}

export function getBundlePrice(
  slotOption: BundleSlotOptionWithSizes,
  sizeLabel: string,
): number | null {
  const size = slotOption.protein_sizes.find((s) => s.size_label === sizeLabel);
  return size?.price_cents ?? null;
}

export function getDefaultProteinSize(
  slotOption: BundleSlotOptionWithSizes,
): BundleProteinSize | undefined {
  const sorted = sortProteinSizes(slotOption.protein_sizes);
  return sorted.find((s) => s.is_default) ?? sorted[0];
}

export function getMinBundlePrice(bundle: BundleWithOptions): number {
  let min = Infinity;
  for (const slot of bundle.slot_options) {
    for (const size of slot.protein_sizes) {
      if (size.price_cents < min) min = size.price_cents;
    }
  }
  return min === Infinity ? 0 : min;
}
