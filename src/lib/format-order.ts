import { formatPrice } from './pricing';
import type { CartItem } from '@/stores/cartStore';

export function formatBundleOrder(
  bundleName: string,
  slotCount: number,
  priceCents: number,
  selections: { name: string }[],
): string {
  const mealCounts = selections.reduce((acc, meal) => {
    acc[meal.name] = (acc[meal.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let message = `Hey Los Meal Preps! I'd like to order the ${bundleName} (${slotCount} meals).\n\nMy selections:\n`;
  Object.entries(mealCounts).forEach(([name, count]) => {
    message += `- ${count}x ${name}\n`;
  });
  message += `\nTotal: ${formatPrice(priceCents)}\n\nLet me know how to proceed with payment!`;

  return message;
}

export interface CustomOrderDetails {
  proteinName: string;
  proteinSize: string;
  proteinPriceCents: number;
  carbName: string | null;
  carbUpchargeCents: number;
  veggieNames: string[];
  sauceNames: string[];
  flavorName: string | null;
  sideSauceName: string | null;
  sideSauceSize: string | null;
  sideSaucePriceCents: number;
  totalCents: number;
  macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number } | null;
}

export function formatCustomOrder(d: CustomOrderDetails): string {
  let msg = `Hey Los Meal Preps! I'd like to order a Custom Meal.\n\n`;
  msg += `Protein: ${d.proteinName}${d.proteinSize ? ` (${d.proteinSize})` : ''} (${formatPrice(d.proteinPriceCents)})\n`;
  if (d.carbName) msg += `Carb: ${d.carbName}${d.carbUpchargeCents > 0 ? ` (+${formatPrice(d.carbUpchargeCents)})` : ''}\n`;
  if (d.veggieNames.length) msg += `Veggies: ${d.veggieNames.join(', ')}\n`;
  if (d.flavorName) msg += `Marinade: ${d.flavorName}\n`;
  if (d.sideSauceName && d.sideSauceSize) {
    msg += `Side sauce: ${d.sideSauceName} (${d.sideSauceSize})`;
    if (d.sideSaucePriceCents > 0) msg += ` (+${formatPrice(d.sideSaucePriceCents)})`;
    msg += '\n';
  }
  msg += `\nTotal: ${formatPrice(d.totalCents)}`;
  if (d.macros) {
    msg += `\nMacros: ${d.macros.calories} cal | ${d.macros.protein_g}g protein | ${d.macros.carbs_g}g carbs | ${d.macros.fat_g}g fat`;
  }
  msg += `\n\nLet me know how to proceed with payment!`;
  return msg;
}

export function formatFullOrder(items: CartItem[]): string {
  const mealSummary = new Map<string, { count: number; unitPriceCents: number }>();
  let msg = `Hey Los Meal Preps! I'd like to place this order:\n\n`;
  let totalCents = 0;

  const customItems = items.filter((item) => item.kind === 'custom');
  const bundleItems = items.filter((item) => item.kind === 'bundle');
  items.forEach((item) => {
    if (item.kind === 'meal') {
      const current = mealSummary.get(item.meal.name);
      mealSummary.set(item.meal.name, {
        count: (current?.count ?? 0) + 1,
        unitPriceCents: item.meal.base_price_cents,
      });
      totalCents += item.meal.base_price_cents;
      return;
    }
    if (item.kind === 'bundle') {
      totalCents += item.bundle.totalCents;
      return;
    }
    totalCents += item.build.totalCents;
  });

  if (mealSummary.size > 0) {
    msg += `Signature Meals:\n`;
    for (const [name, details] of mealSummary.entries()) {
      const lineTotal = details.count * details.unitPriceCents;
      msg += `- ${details.count}x ${name} (${formatPrice(lineTotal)})\n`;
    }
    msg += '\n';
  }

  if (customItems.length > 0) {
    msg += `Custom Meals:\n`;
    customItems.forEach((item, index) => {
      const build = item.build;
      msg += `${index + 1}) ${build.proteinName}${build.proteinSize ? ` (${build.proteinSize})` : ''}`;
      msg += ` (${formatPrice(build.proteinPriceCents ?? 0)})\n`;
      if (build.carbName) {
        const carbExtra = build.carbUpchargeCents && build.carbUpchargeCents > 0
          ? ` (+${formatPrice(build.carbUpchargeCents)})`
          : '';
        msg += `   Carb: ${build.carbName}${carbExtra}\n`;
      }
      if (build.veggieNames.length) msg += `   Veggies: ${build.veggieNames.join(', ')}\n`;
      if (build.flavorName) msg += `   Marinade: ${build.flavorName}\n`;
      if (build.sideSauceName && build.sideSauceSize) {
        const sideSauceExtra = build.sideSaucePriceCents && build.sideSaucePriceCents > 0
          ? ` (+${formatPrice(build.sideSaucePriceCents)})`
          : '';
        msg += `   Side sauce: ${build.sideSauceName} (${build.sideSauceSize})${sideSauceExtra}\n`;
      }
      msg += `   Meal total: ${formatPrice(build.totalCents)}\n`;
      msg += `   Macros: ${build.macros.calories} cal | ${build.macros.protein_g}g protein | ${build.macros.carbs_g}g carbs | ${build.macros.fat_g}g fat\n`;
    });
    msg += '\n';
  }

  if (bundleItems.length > 0) {
    msg += `Bundles:\n`;
    bundleItems.forEach((item, index) => {
      const bundle = item.bundle;
      msg += `${index + 1}) ${bundle.bundleName} (${bundle.slotCount} meals)\n`;
      const bundleMealCounts = bundle.mealNames.reduce((acc, name) => {
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.entries(bundleMealCounts).forEach(([name, count]) => {
        msg += `   - ${count}x ${name}\n`;
      });
      msg += `   Bundle total: ${formatPrice(bundle.totalCents)}\n`;
    });
    msg += '\n';
  }

  msg += `Order total: ${formatPrice(totalCents)}\n\n`;
  msg += `Let me know how to proceed with payment!`;
  return msg;
}
