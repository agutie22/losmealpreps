import type { CartItem } from '@/stores/cartStore';

export interface SaucePricingConfig {
  single_price_cents: number;
  pair_price_cents: number;
  free_threshold_cents: number;
}

export const DEFAULT_SAUCE_CONFIG: SaucePricingConfig = {
  single_price_cents: 150,
  pair_price_cents: 250,
  free_threshold_cents: 6000,
};

export function parseSauceConfig(raw?: string | null): SaucePricingConfig {
  if (!raw) return DEFAULT_SAUCE_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    return {
      single_price_cents: typeof parsed.single_price_cents === 'number' ? parsed.single_price_cents : DEFAULT_SAUCE_CONFIG.single_price_cents,
      pair_price_cents: typeof parsed.pair_price_cents === 'number' ? parsed.pair_price_cents : DEFAULT_SAUCE_CONFIG.pair_price_cents,
      free_threshold_cents: typeof parsed.free_threshold_cents === 'number' ? parsed.free_threshold_cents : DEFAULT_SAUCE_CONFIG.free_threshold_cents,
    };
  } catch {
    return DEFAULT_SAUCE_CONFIG;
  }
}

export interface CartMathResult {
  subtotalCents: number;
  sauceCount: number;
  eligibleSpendCents: number;
  discountCents: number;
  totalCents: number;
}

export function calculateCartTotals(items: CartItem[], config: SaucePricingConfig): CartMathResult {
  let subtotalCents = 0;
  let sauceCount = 0;
  let eligibleSpendCents = 0;

  // 1. Calculate raw subtotal and count sauces
  for (const item of items) {
    if (item.kind === 'meal') {
      subtotalCents += item.meal.base_price_cents;
      eligibleSpendCents += item.meal.base_price_cents;
    } else if (item.kind === 'bundle') {
      subtotalCents += item.bundle.totalCents;
      eligibleSpendCents += item.bundle.totalCents;
    } else if (item.kind === 'custom') {
      subtotalCents += item.build.totalCents;
      // Subtract side sauce from eligible spend (the side sauce price is included in totalCents)
      const sideSaucePrice = item.build.sideSaucePriceCents || 0;
      eligibleSpendCents += (item.build.totalCents - sideSaucePrice);
      if (sideSaucePrice > 0) {
        sauceCount++;
      }
    } else if (item.kind === 'addon') {
      subtotalCents += item.addon.priceCents;
      // Addons (like sauces) are excluded from eligible spend
      sauceCount++;
    }
  }

  // 2. Apply rules
  let discountCents = 0;
  let remainingSauces = sauceCount;

  // Rule 1: Free sauce if spend >= threshold
  if (eligibleSpendCents >= config.free_threshold_cents && remainingSauces > 0) {
    remainingSauces--; // One is free
    // The "base" price of a sauce that we are making free is the single_price_cents
    // wait, what if the sideSaucePriceCents in a custom meal was different? 
    // To be safe, we assume all sauces have a base price equal to single_price_cents for the discount math.
    // However, if the cart had a side sauce that was 150 cents, making it free means a 150 cent discount.
  }

  // Rule 2: Tiered pricing for remaining sauces
  const pairs = Math.floor(remainingSauces / 2);
  const singles = remainingSauces % 2;
  const newSaucesCost = (pairs * config.pair_price_cents) + (singles * config.single_price_cents);

  // The raw cost of sauces added to the subtotal is roughly (sauceCount * config.single_price_cents)
  // Let's accurately calculate how much was actually added to `subtotalCents` for sauces:
  let actualSauceCostInSubtotal = 0;
  for (const item of items) {
    if (item.kind === 'custom' && item.build.sideSaucePriceCents) {
      actualSauceCostInSubtotal += item.build.sideSaucePriceCents;
    } else if (item.kind === 'addon') {
      actualSauceCostInSubtotal += item.addon.priceCents;
    }
  }

  // The discount is what we originally charged for sauces MINUS what they should cost now
  discountCents = actualSauceCostInSubtotal - newSaucesCost;

  // Ensure discount isn't negative (e.g. if config pairs > 2 * single price, which is weird but possible)
  if (discountCents < 0) discountCents = 0;

  const totalCents = subtotalCents - discountCents;

  return {
    subtotalCents,
    sauceCount,
    eligibleSpendCents,
    discountCents,
    totalCents,
  };
}
