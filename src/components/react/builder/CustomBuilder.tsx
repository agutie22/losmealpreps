import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { sumCustomMealMacros, type Macros } from '@/lib/macros';
import { priceCustomMeal, formatPrice } from '@/lib/pricing';
import { fetchCustomLineData } from '@/lib/queries/public';
import { useCartStore } from '@/stores/cartStore';
import type {
  CustomMealConfig,
  CustomLineData,
  Ingredient,
  IngredientVariant,
  IngredientWithVariants,
} from '@/lib/queries/public';

interface Props {
  proteins: IngredientWithVariants[];
  carbs: Ingredient[];
  veggies: Ingredient[];
  sideSauces: IngredientWithVariants[];
  flavors: Ingredient[];
  config: CustomMealConfig;
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-[family-name:var(--font-display)] font-semibold text-[20px] text-[var(--color-fg)]">
        {title}
      </h2>
      {hint && <p className="text-[13px] text-[var(--color-fg-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function SelectCard({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-[var(--radius-card)] border-2 transition-all',
        disabled
          ? 'opacity-40 cursor-not-allowed border-[var(--color-surface-sunken)] bg-[var(--color-surface-elevated)]'
          : selected
            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
            : 'border-[var(--color-surface-sunken)] hover:border-[var(--color-brand)]/50 bg-[var(--color-surface-elevated)]',
      )}
    >
      {children}
    </button>
  );
}

function CustomBuilderInner({
  proteins,
  carbs,
  veggies,
  sideSauces,
  flavors,
  config,
}: Props) {
  type StepKey = 'protein' | 'carb' | 'veggies' | 'flavor' | 'sideSauce' | 'review';
  const addCustomItem = useCartStore((state) => state.addCustomItem);
  const [proteinId, setProteinId] = useState<string | null>(null);
  const [proteinVarId, setProteinVarId] = useState<string | null>(null);
  const [carbId, setCarbId] = useState<string | null>(null);
  const [veggieIds, setVeggieIds] = useState<string[]>([]);
  const [flavorId, setFlavorId] = useState<string | null>(null);
  const [sideSauceId, setSideSauceId] = useState<string | null>(null);
  const [sideSauceVarId, setSideSauceVarId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const protein = useMemo(
    () => proteins.find(p => p.id === proteinId) ?? null,
    [proteins, proteinId],
  );
  const proteinVariant = useMemo<IngredientVariant | null>(
    () =>
      protein?.variants.find(v => v.id === proteinVarId) ??
      protein?.variants.find(v => v.is_default) ??
      protein?.variants[0] ??
      null,
    [protein, proteinVarId],
  );
  const carb = useMemo(() => carbs.find(c => c.id === carbId) ?? null, [carbs, carbId]);
  const veggieList = useMemo(
    () => veggieIds.map(id => veggies.find(v => v.id === id)).filter(Boolean) as Ingredient[],
    [veggies, veggieIds],
  );
  const flavor = useMemo(() => flavors.find(f => f.id === flavorId) ?? null, [flavors, flavorId]);
  const sideSauce = useMemo(
    () => sideSauces.find(s => s.id === sideSauceId) ?? null,
    [sideSauces, sideSauceId],
  );
  const sideSauceVariant = useMemo<IngredientVariant | null>(
    () =>
      sideSauce?.variants.find(v => v.id === sideSauceVarId) ??
      sideSauce?.variants.find(v => v.is_default) ??
      sideSauce?.variants[0] ??
      null,
    [sideSauce, sideSauceVarId],
  );
  const steps = useMemo<{ key: StepKey; title: string; required: boolean }[]>(() => {
    const list: { key: StepKey; title: string; required: boolean }[] = [{ key: 'protein', title: 'Protein', required: true }];
    if (carbs.length > 0) list.push({ key: 'carb', title: 'Carb', required: false });
    if (veggies.length > 0) list.push({ key: 'veggies', title: 'Veggies', required: false });
    if (flavors.length > 0) list.push({ key: 'flavor', title: 'Flavor', required: false });
    if (sideSauces.length > 0) list.push({ key: 'sideSauce', title: 'Side Sauce', required: false });
    list.push({ key: 'review', title: 'Review', required: false });
    return list;
  }, [carbs.length, veggies.length, flavors.length, sideSauces.length]);


  const totalCents = useMemo(() => {
    if (!protein) return 0;
    return priceCustomMeal({
      basePriceCents: 0,
      proteinVariantPriceCents: proteinVariant?.price_cents ?? 0,
      extraUpchargesCents: [
        ...(carb ? [carb.upcharge_cents] : []),
        ...(sideSauceVariant ? [sideSauceVariant.price_cents] : []),
      ],
    });
  }, [protein, proteinVariant, carb, sideSauceVariant]);

  const totalMacros = useMemo<Macros>(() => {
    const parts: Macros[] = [];
    if (protein) {
      // Use variant macros when available (size-accurate); fall back to ingredient-level macros
      const macroSrc = proteinVariant ?? protein;
      parts.push({
        calories: macroSrc.calories,
        protein_g: macroSrc.protein_g,
        carbs_g: macroSrc.carbs_g,
        fat_g: macroSrc.fat_g,
      });
    }
    if (carb)
      parts.push({ calories: carb.calories, protein_g: carb.protein_g, carbs_g: carb.carbs_g, fat_g: carb.fat_g });
    veggieList.forEach(v =>
      parts.push({ calories: v.calories, protein_g: v.protein_g, carbs_g: v.carbs_g, fat_g: v.fat_g }),
    );
    if (sideSauceVariant)
      parts.push({
        calories: sideSauceVariant.calories,
        protein_g: sideSauceVariant.protein_g,
        carbs_g: sideSauceVariant.carbs_g,
        fat_g: sideSauceVariant.fat_g,
      });
    return sumCustomMealMacros(parts);
  }, [protein, proteinVariant, carb, veggieList, sideSauceVariant]);

  const toggleVeggie = (id: string) => {
    setVeggieIds(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= config.max_veggie_count) return prev;
      return [...prev, id];
    });
  };

  const selectSideSauce = (sauce: IngredientWithVariants) => {
    if (sideSauceId === sauce.id) {
      setSideSauceId(null);
      setSideSauceVarId(null);
    } else {
      setSideSauceId(sauce.id);
      setSideSauceVarId(
        sauce.variants.find(v => v.is_default)?.id ?? sauce.variants[0]?.id ?? null,
      );
    }
  };

  const resetBuilder = () => {
    setProteinId(null);
    setProteinVarId(null);
    setCarbId(null);
    setVeggieIds([]);
    setFlavorId(null);
    setSideSauceId(null);
    setSideSauceVarId(null);
  };

  const handleAddToCart = () => {
    if (!protein) {
      alert('Please select a protein to continue.');
      return;
    }
    addCustomItem({
      proteinName: protein.name,
      proteinSize: proteinVariant?.size_label ?? '',
      proteinPriceCents: proteinVariant?.price_cents ?? 0,
      carbName: carb?.name ?? null,
      carbUpchargeCents: carb?.upcharge_cents ?? 0,
      veggieNames: veggieList.map(v => v.name),
      sauceNames: [],
      flavorName: flavor?.name ?? null,
      sideSauceName: sideSauce?.name ?? null,
      sideSauceSize: sideSauceVariant?.size_label ?? null,
      sideSaucePriceCents: sideSauceVariant?.price_cents ?? 0,
      totalCents,
      macros: totalMacros,
      selection: {
        proteinId: protein.id,
        proteinVariantId: proteinVariant?.id ?? null,
        carbId: carb?.id ?? null,
        veggieIds: veggieList.map((v) => v.id),
        flavorId: flavor?.id ?? null,
        sideSauceId: sideSauce?.id ?? null,
        sideSauceVariantId: sideSauceVariant?.id ?? null,
      },
    });
    resetBuilder();
    setCurrentStepIndex(0);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2500);
  };

  const safeStepIndex = Math.min(currentStepIndex, Math.max(0, steps.length - 1));
  const activeStep = steps[safeStepIndex];
  const isLastStep = safeStepIndex === steps.length - 1;
  const canProceed = activeStep?.key !== 'protein' || !!proteinId;
  const progress = ((safeStepIndex + 1) / steps.length) * 100;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">
          {/* Left: selection sections */}
          <div className="space-y-10">
            <div className="lg:hidden bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-fg-muted)] font-semibold">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
                <p className="text-[13px] font-semibold text-[var(--color-fg)]">{activeStep?.title}</p>
              </div>
              <div className="h-2 w-full bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {/* Protein */}
            <section className={cn(activeStep?.key === 'protein' ? 'block' : 'hidden', 'lg:block')}>
              <SectionHeader title="Choose your protein" hint="Required. Pick one." />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {proteins.map(p => {
                  const defaultVar = p.variants.find(v => v.is_default) ?? p.variants[0];
                  return (
                    <SelectCard
                      key={p.id}
                      selected={proteinId === p.id}
                      onClick={() => {
                        setProteinId(p.id);
                        setProteinVarId(defaultVar?.id ?? null);
                      }}
                    >
                      <p className="font-semibold text-[14px] text-[var(--color-fg)] leading-tight">{p.name}</p>
                      {defaultVar && (
                        <p className="text-[12px] text-[var(--color-fg-muted)] mt-1">
                          {defaultVar.size_label} · {formatPrice(defaultVar.price_cents)}
                        </p>
                      )}
                    </SelectCard>
                  );
                })}
              </div>

              {protein && protein.variants.length > 1 && (
                <div className="mt-4">
                  <p className="text-[13px] font-medium text-[var(--color-fg-muted)] mb-2">Protein size</p>
                  <div className="flex flex-wrap gap-2">
                    {protein.variants.map((variant) => {
                      const active = proteinVariant?.id === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setProteinVarId(variant.id)}
                          className={cn(
                            'px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-medium border transition-colors',
                            active
                              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                              : 'border-[var(--color-surface-sunken)] text-[var(--color-fg-muted)]',
                          )}
                        >
                          {variant.size_label} · {formatPrice(variant.price_cents)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Marinade / Flavor */}
            {flavors.length > 0 && (
              <section className={cn(activeStep?.key === 'flavor' ? 'block' : 'hidden', 'lg:block')}>
                <SectionHeader
                  title="Choose a marinade"
                  hint="Optional. Your protein will be prepared in this marinade."
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {flavors.map(f => (
                    <SelectCard
                      key={f.id}
                      selected={flavorId === f.id}
                      onClick={() => setFlavorId(prev => (prev === f.id ? null : f.id))}
                    >
                      <p className="font-semibold text-[14px] text-[var(--color-fg)] leading-tight">{f.name}</p>
                    </SelectCard>
                  ))}
                </div>
              </section>
            )}

            {/* Carb */}
            {carbs.length > 0 && (
              <section className={cn(activeStep?.key === 'carb' ? 'block' : 'hidden', 'lg:block')}>
                <SectionHeader
                  title="Choose your carb"
                  hint="Optional. Premium options include a small upcharge."
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {carbs.map(c => (
                    <SelectCard
                      key={c.id}
                      selected={carbId === c.id}
                      onClick={() => setCarbId(prev => (prev === c.id ? null : c.id))}
                    >
                      <p className="font-semibold text-[14px] text-[var(--color-fg)] leading-tight">{c.name}</p>
                      {c.upcharge_cents > 0 && (
                        <p className="text-[12px] text-[var(--color-accent)] mt-1">+{formatPrice(c.upcharge_cents)}</p>
                      )}
                    </SelectCard>
                  ))}
                </div>
              </section>
            )}

            {/* Veggies */}
            {veggies.length > 0 && (
              <section className={cn(activeStep?.key === 'veggies' ? 'block' : 'hidden', 'lg:block')}>
                <SectionHeader
                  title="Choose your veggies"
                  hint={`All included · up to ${config.max_veggie_count} (${veggieIds.length}/${config.max_veggie_count} selected)`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {veggies.map(v => {
                    const isSelected = veggieIds.includes(v.id);
                    return (
                      <SelectCard
                        key={v.id}
                        selected={isSelected}
                        disabled={!isSelected && veggieIds.length >= config.max_veggie_count}
                        onClick={() => toggleVeggie(v.id)}
                      >
                        <p className="font-semibold text-[14px] text-[var(--color-fg)] leading-tight">{v.name}</p>
                      </SelectCard>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Side sauce */}
            {sideSauces.length > 0 && (
              <section className={cn(activeStep?.key === 'sideSauce' ? 'block' : 'hidden', 'lg:block')}>
                <SectionHeader title="Add a side sauce" hint="Optional. Served on the side — extra charge applies." />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sideSauces.map(ss => (
                    <SelectCard
                      key={ss.id}
                      selected={sideSauceId === ss.id}
                      onClick={() => selectSideSauce(ss)}
                    >
                      <p className="font-semibold text-[14px] text-[var(--color-fg)] leading-tight">{ss.name}</p>
                      {sideSauceId === ss.id && ss.variants.length > 1 ? (
                        <div
                          className="mt-3 flex gap-2 flex-wrap"
                          onClick={e => e.stopPropagation()}
                        >
                          {ss.variants.map(vv => {
                            const active =
                              sideSauceVarId === vv.id || (!sideSauceVarId && vv.is_default);
                            return (
                              <button
                                key={vv.id}
                                type="button"
                                onClick={() => setSideSauceVarId(vv.id)}
                                className={cn(
                                  'px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-medium border transition-colors',
                                  active
                                    ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                                    : 'border-[var(--color-surface-sunken)] text-[var(--color-fg-muted)]',
                                )}
                              >
                                {vv.size_label} · {formatPrice(vv.price_cents)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        ss.variants.length > 0 && (
                          <p className="text-[12px] text-[var(--color-fg-muted)] mt-1">
                            from {formatPrice(Math.min(...ss.variants.map(v => v.price_cents)))}
                          </p>
                        )
                      )}
                    </SelectCard>
                  ))}
                </div>
              </section>
            )}

            <section className={cn(activeStep?.key === 'review' ? 'block' : 'hidden', 'lg:hidden')}>
              <SectionHeader title="Review your meal" hint="Confirm your build before adding to cart." />
              <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] p-5 space-y-4">
                <div className="space-y-1.5 text-[13px]">
                  {protein ? (
                    <p className="text-[var(--color-fg)]">
                      <span className="font-medium">{protein.name}</span>
                      {proteinVariant && (
                        <span className="text-[var(--color-fg-muted)]"> ({proteinVariant.size_label})</span>
                      )}
                      {flavor && (
                        <span className="text-[var(--color-fg-muted)]"> · {flavor.name}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-[var(--color-fg-subtle)] italic">No protein selected</p>
                  )}
                  {carb && <p className="text-[var(--color-fg)]">+ <span className="font-medium">{carb.name}</span></p>}
                  {veggieList.map(v => <p key={v.id} className="text-[var(--color-fg)]">+ <span className="font-medium">{v.name}</span></p>)}
                  {sideSauce && sideSauceVariant && (
                    <p className="text-[var(--color-fg)]">+ <span className="font-medium">{sideSauce.name}</span> <span className="text-[var(--color-fg-muted)]">({sideSauceVariant.size_label})</span></p>
                  )}
                </div>
                {protein && (
                  <div className="bg-[var(--color-surface-base)] rounded-[var(--radius-card)] p-4 grid grid-cols-2 gap-3 text-[13px]">
                    <div><p className="text-[var(--color-fg-muted)]">Calories</p><p className="font-semibold text-[var(--color-fg)]">{totalMacros.calories}</p></div>
                    <div><p className="text-[var(--color-fg-muted)]">Protein</p><p className="font-semibold text-[var(--color-fg)]">{totalMacros.protein_g}g</p></div>
                    <div><p className="text-[var(--color-fg-muted)]">Carbs</p><p className="font-semibold text-[var(--color-fg)]">{totalMacros.carbs_g}g</p></div>
                    <div><p className="text-[var(--color-fg-muted)]">Fat</p><p className="font-semibold text-[var(--color-fg)]">{totalMacros.fat_g}g</p></div>
                  </div>
                )}
                <div className="border-t border-[var(--color-surface-sunken)] pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px] text-[var(--color-fg-muted)]">Total</span>
                    <span className="font-[family-name:var(--font-display)] font-bold text-[24px] text-[var(--color-fg)]">{formatPrice(totalCents)}</span>
                  </div>
                </div>
              </div>
            </section>

            {justAdded && (
              <p className="lg:hidden text-[12px] text-[var(--color-brand)] text-center font-medium -mt-4">
                Added to cart.
              </p>
            )}
          </div>

          {/* Right: sticky summary */}
          <div className="hidden lg:block lg:sticky lg:top-[88px]">
            <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] p-6 space-y-5">
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-[18px] text-[var(--color-fg)]">
                Your Meal
              </h3>

              <div className="space-y-1.5 text-[13px]">
                {protein ? (
                  <p className="text-[var(--color-fg)]">
                    <span className="font-medium">{protein.name}</span>
                    {proteinVariant && (
                      <span className="text-[var(--color-fg-muted)]"> ({proteinVariant.size_label})</span>
                    )}
                    {flavor && (
                      <span className="text-[var(--color-fg-muted)]"> · {flavor.name}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-[var(--color-fg-subtle)] italic">No protein selected</p>
                )}
                {carb && (
                  <p className="text-[var(--color-fg)]">
                    + <span className="font-medium">{carb.name}</span>
                  </p>
                )}
                {veggieList.map(v => (
                  <p key={v.id} className="text-[var(--color-fg)]">
                    + <span className="font-medium">{v.name}</span>
                  </p>
                ))}
                {sideSauce && sideSauceVariant && (
                  <p className="text-[var(--color-fg)]">
                    + <span className="font-medium">{sideSauce.name}</span>{' '}
                    <span className="text-[var(--color-fg-muted)]">({sideSauceVariant.size_label})</span>
                  </p>
                )}
              </div>

              {protein && (
                <div className="bg-[var(--color-surface-base)] rounded-[var(--radius-card)] p-4 grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <p className="text-[var(--color-fg-muted)]">Calories</p>
                    <p className="font-semibold text-[var(--color-fg)]">{totalMacros.calories}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-fg-muted)]">Protein</p>
                    <p className="font-semibold text-[var(--color-fg)]">{totalMacros.protein_g}g</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-fg-muted)]">Carbs</p>
                    <p className="font-semibold text-[var(--color-fg)]">{totalMacros.carbs_g}g</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-fg-muted)]">Fat</p>
                    <p className="font-semibold text-[var(--color-fg)]">{totalMacros.fat_g}g</p>
                  </div>
                </div>
              )}

              <div className="border-t border-[var(--color-surface-sunken)] pt-4">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-[14px] text-[var(--color-fg-muted)]">Total</span>
                  <span className="font-[family-name:var(--font-display)] font-bold text-[28px] text-[var(--color-fg)]">
                    {formatPrice(totalCents)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-[var(--color-brand)] text-[var(--color-surface-elevated)] py-3 rounded-[var(--radius-pill)] text-[14px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
                >
                  Add Custom Meal to Cart
                </button>
                <p className="text-[11px] text-[var(--color-fg-subtle)] text-center mt-3">
                  Add multiple custom meals, then send one order from your cart.
                </p>
                {justAdded && (
                  <p className="text-[11px] text-[var(--color-brand)] text-center mt-2 font-medium">
                    Added to cart.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="lg:hidden mt-2 bg-[var(--color-surface-elevated)] border border-[var(--color-surface-sunken)] rounded-[var(--radius-card)] px-4 py-3"
        >
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              disabled={currentStepIndex === 0}
              className="w-1/3 py-3 rounded-[var(--radius-pill)] border border-[var(--color-surface-sunken)] text-[13px] font-semibold text-[var(--color-fg)] disabled:opacity-50"
            >
              Back
            </button>
            {isLastStep ? (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!proteinId}
                className="w-2/3 bg-[var(--color-brand)] text-[var(--color-surface-elevated)] py-3 rounded-[var(--radius-pill)] text-[14px] font-semibold disabled:bg-[var(--color-surface-sunken)] disabled:text-[var(--color-fg-subtle)]"
              >
                Add to Cart · {formatPrice(totalCents)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                disabled={!canProceed}
                className="w-2/3 bg-[var(--color-brand)] text-[var(--color-surface-elevated)] py-3 rounded-[var(--radius-pill)] text-[14px] font-semibold disabled:bg-[var(--color-surface-sunken)] disabled:text-[var(--color-fg-subtle)]"
              >
                {activeStep?.required && !canProceed ? 'Choose Protein First' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomBuilder() {
  const [data, setData] = useState<CustomLineData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchCustomLineData()
      .then(setData)
      .catch((err) => {
        console.error(err);
        setLoadError(true);
      });
  }, []);

  if (loadError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12 flex items-center justify-center min-h-[40vh]">
        <p className="text-[var(--color-fg-muted)] text-[16px]">
          Failed to load ingredients. Please refresh and try again.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12 flex items-center justify-center min-h-[40vh]">
        <div className="text-[var(--color-fg-muted)] text-[16px]">Loading ingredients…</div>
      </div>
    );
  }

  return <CustomBuilderInner {...data} />;
}
