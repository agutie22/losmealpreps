export const centsToDecimal = (cents: number) => (cents / 100).toFixed(2);
export const formatPrice = (cents: number) => `$${centsToDecimal(cents)}`;

export function priceCustomMeal(params: {
  basePriceCents: number;
  proteinVariantPriceCents: number;
  extraUpchargesCents: number[];
}): number {
  return (
    params.basePriceCents +
    params.proteinVariantPriceCents +
    params.extraUpchargesCents.reduce((s, c) => s + c, 0)
  );
}
