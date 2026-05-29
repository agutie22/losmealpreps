import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { BundleWithOptions, BundleSlotOptionWithSizes, BundleWithOptionsRow } from '@/lib/bundles';
import { mapBundleWithOptions, sortProteinSizes } from '@/lib/bundles';
import { centsToDecimal, formatPrice } from '@/lib/pricing';

async function fetchBundlesForAdmin(): Promise<BundleWithOptions[]> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*, bundle_slot_options(*, bundle_protein_sizes(*))')
    .order('slug', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapBundleWithOptions(row as BundleWithOptionsRow));
}

const BUNDLE_TABS = [
  { slug: 'staple', label: 'Staple' },
  { slug: 'weekly', label: 'Weekly' },
] as const;

interface BundleHeaderDraft {
  display_name: string;
  tagline: string;
  is_active: boolean;
}

interface SizeFormRow {
  id?: string;
  size_label: string;
  price: string;
  is_default: boolean;
}

interface SlotForm {
  slot_count: string;
  label: string;
  is_default: boolean;
  sizes: SizeFormRow[];
}

const emptySizeRow = (isDefault = false): SizeFormRow => ({
  size_label: '',
  price: '',
  is_default: isDefault,
});

const EMPTY_SLOT_FORM: SlotForm = {
  slot_count: '5',
  label: '',
  is_default: false,
  sizes: [{ ...emptySizeRow(true), size_label: '6 oz' }],
};

function slotToForm(slot: BundleSlotOptionWithSizes): SlotForm {
  return {
    slot_count: String(slot.slot_count),
    label: slot.label ?? '',
    is_default: slot.is_default,
    sizes: sortProteinSizes(slot.protein_sizes).map((s) => ({
      id: s.id,
      size_label: s.size_label,
      price: centsToDecimal(s.price_cents),
      is_default: s.is_default,
    })),
  };
}

function bundleToHeaderDraft(bundle: BundleWithOptions): BundleHeaderDraft {
  return {
    display_name: bundle.display_name,
    tagline: bundle.tagline ?? '',
    is_active: bundle.is_active,
  };
}

function sizesSummary(slot: BundleSlotOptionWithSizes): string {
  if (slot.protein_sizes.length === 0) return '—';
  return sortProteinSizes(slot.protein_sizes)
    .map((s) => `${s.size_label} ${formatPrice(s.price_cents)}`)
    .join(' · ');
}

export default function BundleEditor() {
  const [bundles, setBundles] = useState<BundleWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<'staple' | 'weekly'>('staple');

  const [headerDraft, setHeaderDraft] = useState<BundleHeaderDraft | null>(null);
  const [headerDirty, setHeaderDirty] = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);

  const [modalSlot, setModalSlot] = useState<BundleSlotOptionWithSizes | 'new' | null>(null);
  const [slotForm, setSlotForm] = useState<SlotForm>(EMPTY_SLOT_FORM);
  const [slotSaving, setSlotSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBundles(await fetchBundlesForAdmin());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bundles');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeBundle = bundles.find((b) => b.slug === activeSlug);

  useEffect(() => {
    if (activeBundle) {
      setHeaderDraft(bundleToHeaderDraft(activeBundle));
      setHeaderDirty(false);
    }
  }, [activeBundle?.id, activeSlug]); // reset draft when switching tabs

  const switchTab = (slug: 'staple' | 'weekly') => {
    if (headerDirty && !confirm('Discard unsaved bundle changes?')) return;
    setActiveSlug(slug);
    const bundle = bundles.find((b) => b.slug === slug);
    if (bundle) {
      setHeaderDraft(bundleToHeaderDraft(bundle));
      setHeaderDirty(false);
    }
  };

  const patchHeader = (updates: Partial<BundleHeaderDraft>) => {
    setHeaderDraft((d) => (d ? { ...d, ...updates } : d));
    setHeaderDirty(true);
  };

  const discardHeader = () => {
    if (activeBundle) setHeaderDraft(bundleToHeaderDraft(activeBundle));
    setHeaderDirty(false);
  };

  const saveHeader = async () => {
    if (!activeBundle || !headerDraft) return;
    if (!headerDraft.display_name.trim()) {
      alert('Display name is required.');
      return;
    }
    setHeaderSaving(true);
    const { error: saveError } = await supabase
      .from('bundles')
      .update({
        display_name: headerDraft.display_name.trim(),
        tagline: headerDraft.tagline.trim() || null,
        is_active: headerDraft.is_active,
      })
      .eq('id', activeBundle.id);
    setHeaderSaving(false);
    if (saveError) {
      alert(saveError.message);
      return;
    }
    setHeaderDirty(false);
    await load();
  };

  const openNewSlot = () => {
    const isFirst = !activeBundle?.slot_options.length;
    setSlotForm({
      ...EMPTY_SLOT_FORM,
      is_default: isFirst,
    });
    setModalSlot('new');
  };

  const openEditSlot = (slot: BundleSlotOptionWithSizes) => {
    setSlotForm(slotToForm(slot));
    setModalSlot(slot);
  };

  const closeSlotModal = () => setModalSlot(null);

  const setSizeField = (index: number, field: keyof SizeFormRow, value: string | boolean) => {
    setSlotForm((f) => {
      const sizes = f.sizes.map((row, i) => {
        if (field === 'is_default') return { ...row, is_default: i === index };
        return i === index ? { ...row, [field]: value } : row;
      });
      return { ...f, sizes };
    });
  };

  const addSizeRow = () => {
    setSlotForm((f) => ({ ...f, sizes: [...f.sizes, emptySizeRow()] }));
  };

  const removeSizeRow = (index: number) => {
    setSlotForm((f) => {
      const sizes = f.sizes.filter((_, i) => i !== index);
      if (sizes.length > 0 && !sizes.some((s) => s.is_default)) {
        sizes[0] = { ...sizes[0], is_default: true };
      }
      return { ...f, sizes };
    });
  };

  const saveSlotModal = async () => {
    if (!activeBundle) return;
    const count = parseInt(slotForm.slot_count, 10);
    if (isNaN(count) || count < 1) {
      alert('Meal count must be at least 1.');
      return;
    }
    if (slotForm.sizes.length === 0) {
      alert('Add at least one protein size.');
      return;
    }
    if (slotForm.sizes.some((s) => !s.size_label.trim())) {
      alert('Every protein size needs a label.');
      return;
    }
    if (!slotForm.sizes.some((s) => s.is_default)) {
      alert('Mark one protein size as default.');
      return;
    }
    for (const s of slotForm.sizes) {
      const p = parseFloat(s.price);
      if (isNaN(p) || p < 0) {
        alert(`Enter a valid price for "${s.size_label}".`);
        return;
      }
    }

    if (modalSlot === null) return;

    setSlotSaving(true);
    try {
      const isNew = modalSlot === 'new';
      const editingSlot = isNew ? null : modalSlot;
      let slotId: string;

      if (slotForm.is_default) {
        await supabase
          .from('bundle_slot_options')
          .update({ is_default: false })
          .eq('bundle_id', activeBundle.id);
      }

      if (isNew) {
        const maxOrder = activeBundle.slot_options.reduce((m, o) => Math.max(m, o.display_order), -1);
        const { data, error: insertError } = await supabase
          .from('bundle_slot_options')
          .insert({
            bundle_id: activeBundle.id,
            slot_count: count,
            label: slotForm.label.trim() || null,
            display_order: maxOrder + 1,
            is_default: slotForm.is_default,
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        slotId = data.id;
      } else {
        slotId = editingSlot!.id;
        const { error: updateError } = await supabase
          .from('bundle_slot_options')
          .update({
            slot_count: count,
            label: slotForm.label.trim() || null,
            is_default: slotForm.is_default,
          })
          .eq('id', slotId);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('bundle_protein_sizes')
          .delete()
          .eq('bundle_slot_option_id', slotId);
        if (deleteError) throw deleteError;
      }

      const { error: sizesError } = await supabase.from('bundle_protein_sizes').insert(
        slotForm.sizes.map((s, i) => ({
          bundle_slot_option_id: slotId,
          size_label: s.size_label.trim(),
          price_cents: Math.round(parseFloat(s.price) * 100),
          is_default: s.is_default,
          display_order: i,
        })),
      );
      if (sizesError) throw sizesError;

      if (slotForm.is_default) {
        await supabase
          .from('bundle_slot_options')
          .update({ is_default: true })
          .eq('id', slotId);
      }

      closeSlotModal();
      await load();
    } catch (e) {
      alert(`Error saving: ${(e as Error).message}`);
    } finally {
      setSlotSaving(false);
    }
  };

  const deleteSlot = async (slot: BundleSlotOptionWithSizes) => {
    if (!confirm(`Remove the ${slot.slot_count}-meal option and all its prices?`)) return;
    const { error: deleteError } = await supabase.from('bundle_slot_options').delete().eq('id', slot.id);
    if (deleteError) alert(deleteError.message);
    else await load();
  };

  const toggleSlotDefault = async (slot: BundleSlotOptionWithSizes) => {
    if (!activeBundle || slot.is_default) return;
    const { error: clearError } = await supabase
      .from('bundle_slot_options')
      .update({ is_default: false })
      .eq('bundle_id', activeBundle.id);
    if (clearError) {
      alert(clearError.message);
      return;
    }
    const { error: setError } = await supabase
      .from('bundle_slot_options')
      .update({ is_default: true })
      .eq('id', slot.id);
    if (setError) alert(setError.message);
    else await load();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]';
  const labelCls =
    'block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1.5';
  const hintCls = 'text-[12px] text-[var(--color-fg-subtle)] mt-1';
  const variantInputCls =
    'w-full px-2 py-1.5 rounded border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]';
  const actionBtnCls =
    'px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors';
  const deleteBtnCls =
    'px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-red-50 hover:text-red-600 transition-colors';

  if (loading) return <div className="text-[var(--color-fg-muted)]">Loading bundles...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!activeBundle || !headerDraft) {
    return <div className="text-[var(--color-fg-muted)]">No bundles configured.</div>;
  }

  const slotOptions = activeBundle.slot_options;

  return (
    <>
      {headerDirty && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] text-[13px]">
          <span className="text-amber-800 font-medium">Unsaved bundle details</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discardHeader}
              className="px-3 py-1.5 text-amber-700 hover:text-amber-900 font-medium rounded transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={saveHeader}
              disabled={headerSaving}
              className="px-4 py-1.5 bg-amber-600 text-white rounded-[var(--radius-pill)] font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {headerSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-[var(--color-surface-sunken)] p-1 rounded-[var(--radius-input)] w-fit">
        {BUNDLE_TABS.map(({ slug, label }) => (
          <button
            key={slug}
            type="button"
            onClick={() => switchTab(slug)}
            className={`px-4 py-1.5 text-[13px] font-medium rounded transition-colors ${
              activeSlug === slug
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-fg)] shadow-sm'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] p-6 mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-bold text-[18px] text-[var(--color-fg)]">
              {activeBundle.display_name}
            </h2>
            <p className="text-[12px] text-[var(--color-fg-subtle)] mt-1">
              {activeBundle.meal_type} meals · Builder: /build?bundle={activeBundle.slug}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={headerDraft.is_active}
              onChange={(e) => patchHeader({ is_active: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--color-brand)]"
            />
            <span className="text-[14px] text-[var(--color-fg)]">Active on site</span>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Display name</label>
            <input
              type="text"
              value={headerDraft.display_name}
              onChange={(e) => patchHeader({ display_name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tagline</label>
            <input
              type="text"
              value={headerDraft.tagline}
              onChange={(e) => patchHeader({ tagline: e.target.value })}
              className={inputCls}
              placeholder="Perfect for the work week"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={openNewSlot}
          className="px-4 py-2 bg-[var(--color-brand)] text-[var(--color-surface-elevated)] rounded-[var(--radius-pill)] text-[14px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          + Add Slot Option
        </button>
      </div>

      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] overflow-hidden">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-[var(--color-surface-sunken)] text-[12px] uppercase text-[var(--color-fg-muted)] tracking-wider">
                <th className="p-4 font-semibold">Meals</th>
                <th className="p-4 font-semibold">Label</th>
                <th className="p-4 font-semibold text-center w-24">Default</th>
                <th className="p-4 font-semibold">Protein sizes &amp; prices</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-[var(--color-surface-sunken)] text-[14px]">
              {slotOptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--color-fg-muted)]">
                    No slot options yet. Add a 5- or 10-meal option to get started.
                  </td>
                </tr>
              )}
              {slotOptions.map((slot) => (
                <tr key={slot.id} className="block md:table-row bg-[var(--color-surface-elevated)] md:bg-transparent border border-[var(--color-surface-sunken)] md:border-none rounded-[var(--radius-card)] md:rounded-none mb-4 md:mb-0 p-4 md:p-0 hover:bg-[var(--color-surface-base)]/50 transition-colors relative">
                  <td className="flex justify-between items-center md:table-cell md:p-4 font-bold md:font-medium text-[16px] md:text-[14px] text-[var(--color-fg)] mb-2 md:mb-0">
                    <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Meals:</span>
                    <span>{slot.slot_count}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell md:p-4 text-[var(--color-fg-muted)] mb-2 md:mb-0">
                    <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Label:</span>
                    <span>{slot.label ?? '—'}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell md:p-4 md:text-center mb-2 md:mb-0">
                    <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Default:</span>
                    <input
                      type="radio"
                      name={`default-slot-${activeBundle.id}`}
                      checked={slot.is_default}
                      onChange={() => toggleSlotDefault(slot)}
                      className="w-4 h-4 accent-[var(--color-brand)] cursor-pointer"
                      title="Default slot count on builder"
                    />
                  </td>
                  <td className="flex justify-between items-start md:items-center md:table-cell md:p-4 text-[var(--color-fg-muted)] text-[13px] mb-4 md:mb-0">
                    <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px] mt-0.5">Sizes:</span>
                    <span className="text-right md:text-left pl-4 md:pl-0 leading-relaxed max-w-[200px] md:max-w-none">{sizesSummary(slot)}</span>
                  </td>
                  <td className="block md:table-cell md:p-4 md:text-center pt-3 border-t border-[var(--color-surface-sunken)] md:border-none md:pt-0">
                    <div className="flex items-center justify-end md:justify-center gap-2 w-full">
                      <button type="button" onClick={() => openEditSlot(slot)} className={actionBtnCls}>
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteSlot(slot)} className={deleteBtnCls}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[13px] text-[var(--color-fg-subtle)] max-w-2xl">
        Customers pick one meal count and one protein size for the whole bundle. All meals in the order use that
        size — no mixing 4 oz and 8 oz in the same bundle.
      </p>

      {modalSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
          <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] shadow-[var(--shadow-rail)] mb-8">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-surface-sunken)]">
              <h2 className="font-[family-name:var(--font-display)] font-bold text-[20px] text-[var(--color-fg)]">
                {modalSlot === 'new'
                  ? 'New Slot Option'
                  : `Edit: ${modalSlot.slot_count} meals`}
              </h2>
              <button
                type="button"
                onClick={closeSlotModal}
                className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Meal count *</label>
                  <input
                    type="number"
                    min={1}
                    value={slotForm.slot_count}
                    onChange={(e) => setSlotForm((f) => ({ ...f, slot_count: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Label (optional)</label>
                  <input
                    type="text"
                    value={slotForm.label}
                    onChange={(e) => setSlotForm((f) => ({ ...f, label: e.target.value }))}
                    className={inputCls}
                    placeholder="Work week"
                  />
                  <p className={hintCls}>
                    Shown on the builder next to the meal count, e.g. &quot;5 meals · Work week&quot;.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slotForm.is_default}
                  onChange={(e) => setSlotForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[var(--color-brand)]"
                />
                <span className="text-[14px] text-[var(--color-fg)]">Default option on builder</span>
              </label>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelCls}>Protein sizes &amp; prices *</label>
                  <button
                    type="button"
                    onClick={addSizeRow}
                    className="text-[13px] font-medium text-[var(--color-brand)] hover:underline"
                  >
                    + Add size
                  </button>
                </div>
                <div className="border border-[var(--color-surface-sunken)] rounded-[var(--radius-input)] overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="bg-[var(--color-surface-sunken)] text-[11px] uppercase text-[var(--color-fg-muted)] tracking-wider">
                        <th className="p-2 pl-3 font-semibold">Size</th>
                        <th className="p-2 font-semibold">Bundle price</th>
                        <th className="p-2 font-semibold text-center w-20">Default</th>
                        <th className="p-2 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface-sunken)]">
                      {slotForm.sizes.map((row, index) => (
                        <tr key={index}>
                          <td className="p-2 pl-3">
                            <input
                              type="text"
                              value={row.size_label}
                              onChange={(e) => setSizeField(index, 'size_label', e.target.value)}
                              className={variantInputCls}
                              placeholder="6 oz"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[var(--color-fg-muted)]">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={row.price}
                                onChange={(e) => setSizeField(index, 'price', e.target.value)}
                                className={variantInputCls}
                                placeholder="65.00"
                              />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="radio"
                              name="default-protein-size"
                              checked={row.is_default}
                              onChange={() => setSizeField(index, 'is_default', true)}
                              className="accent-[var(--color-brand)]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {slotForm.sizes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSizeRow(index)}
                                className="text-[12px] text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-surface-sunken)]">
              <button
                type="button"
                onClick={closeSlotModal}
                className="px-5 py-2.5 text-[14px] font-medium rounded-[var(--radius-pill)] border border-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:border-[var(--color-fg-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSlotModal}
                disabled={slotSaving}
                className={`px-5 py-2.5 text-[14px] font-semibold rounded-[var(--radius-pill)] transition-colors ${
                  slotSaving
                    ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)]'
                    : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'
                }`}
              >
                {slotSaving ? 'Saving…' : modalSlot === 'new' ? 'Create Option' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
