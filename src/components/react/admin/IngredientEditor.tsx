import React, { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { centsToDecimal } from '@/lib/pricing';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type IngredientVariant = Database['public']['Tables']['ingredient_variants']['Row'];
type IngType = 'protein' | 'carb' | 'veggie' | 'sauce' | 'flavor';
type IngredientWithVariants = Ingredient & { variants: IngredientVariant[] };

const TYPE_TABS: { key: IngType; label: string }[] = [
  { key: 'protein', label: 'Proteins' },
  { key: 'carb',    label: 'Carbs' },
  { key: 'veggie',  label: 'Veggies' },
  { key: 'sauce',   label: 'Sauces' },
  { key: 'flavor',  label: 'Marinades' },
];

const TYPES_WITH_VARIANTS: IngType[] = ['protein', 'sauce'];
const TYPES_WITH_MACROS: IngType[] = ['carb', 'veggie', 'flavor'];
const TYPES_WITH_UPCHARGE: IngType[] = ['carb'];

interface VariantForm {
  size_label: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  price: string;
  is_default: boolean;
}

interface IngForm {
  name: string;
  type: IngType;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  upcharge: string;
  is_active: boolean;
  variants: VariantForm[];
}

const emptyVariant = (): VariantForm => ({
  size_label: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', price: '', is_default: false,
});

const EMPTY_FORM = (type: IngType): IngForm => ({
  name: '', type, calories: '', protein_g: '', carbs_g: '', fat_g: '',
  upcharge: '', is_active: true,
  variants: TYPES_WITH_VARIANTS.includes(type) ? [{ ...emptyVariant(), is_default: true }] : [],
});

function ingToForm(ing: IngredientWithVariants): IngForm {
  return {
    name: ing.name,
    type: ing.type as IngType,
    calories: ing.calories ? String(ing.calories) : '',
    protein_g: Number(ing.protein_g) ? String(ing.protein_g) : '',
    carbs_g: Number(ing.carbs_g) ? String(ing.carbs_g) : '',
    fat_g: Number(ing.fat_g) ? String(ing.fat_g) : '',
    upcharge: ing.upcharge_cents ? centsToDecimal(ing.upcharge_cents) : '',
    is_active: ing.is_active,
    variants: ing.variants
      .sort((a, b) => a.display_order - b.display_order)
      .map(v => ({
        size_label: v.size_label,
        calories: String(v.calories),
        protein_g: String(v.protein_g),
        carbs_g: String(v.carbs_g),
        fat_g: String(v.fat_g),
        price: centsToDecimal(v.price_cents),
        is_default: v.is_default,
      })),
  };
}

// Parse "6 oz", "8oz" → number, null if not oz-based
const parseOz = (label: string): number | null => {
  const m = label.match(/(\d+(?:\.\d+)?)\s*oz/i);
  return m ? parseFloat(m[1]) : null;
};
const r1 = (n: number) => Math.round(n * 10) / 10;

function autofillFromDefault(variants: VariantForm[]): VariantForm[] {
  const defIdx = variants.findIndex(v => v.is_default);
  if (defIdx === -1) return variants;
  const def = variants[defIdx];
  const defOz = parseOz(def.size_label);
  const defCal = parseFloat(def.calories);
  if (!defOz || !defCal) return variants;

  // Treat "0" as unset — a prior partial autofill may have written it before the default row was
  // fully filled in. Only preserve non-zero values the user entered manually.
  const fill = (cur: string, defVal: string, calc: (d: number) => string): string => {
    if (cur && cur !== '0') return cur;
    const d = parseFloat(defVal || '0');
    return d ? calc(d) : cur;
  };

  return variants.map((v, i) => {
    if (i === defIdx) return v;
    const vOz = parseOz(v.size_label);
    if (!vOz) return v;
    const ratio = vOz / defOz;
    return {
      ...v,
      calories:  fill(v.calories,  def.calories,  d => String(Math.round(d * ratio))),
      protein_g: fill(v.protein_g, def.protein_g, d => String(r1(d * ratio))),
      carbs_g:   fill(v.carbs_g,   def.carbs_g,   d => String(r1(d * ratio))),
      fat_g:     fill(v.fat_g,     def.fat_g,     d => String(r1(d * ratio))),
    };
  });
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
      <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
      <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  );
}

function SortableRow({
  ing,
  onEdit,
  onClone,
  onDelete,
  onToggleActive,
}: {
  ing: IngredientWithVariants;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onToggleActive: (val: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ing.id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="block md:table-row bg-[var(--color-surface-elevated)] md:bg-transparent border border-[var(--color-surface-sunken)] md:border-none rounded-[var(--radius-card)] md:rounded-none mb-4 md:mb-0 p-4 md:p-0 hover:bg-[var(--color-surface-base)]/50 transition-colors relative"
    >
      <td className="block md:table-cell md:p-3 md:w-8 absolute top-4 right-4 md:relative md:top-auto md:right-auto">
        <button
          {...attributes}
          {...listeners}
          className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)] cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripIcon />
        </button>
      </td>
      <td className="block md:table-cell md:p-4 font-bold md:font-medium text-[16px] md:text-[14px] text-[var(--color-fg)] mb-2 md:mb-0 pr-8 md:pr-0">
        {ing.name}
        {ing.variants.length > 0 && (
          <span className="block md:inline-block md:ml-2 text-[12px] md:text-[11px] text-[var(--color-fg-subtle)] mt-1 md:mt-0">
            {ing.variants.map(v => v.size_label).join(' · ')}
          </span>
        )}
      </td>
      <td className="flex justify-between items-center md:table-cell md:p-4 md:text-center mb-4 md:mb-0">
        <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Visible</span>
        <input
          type="checkbox"
          checked={ing.is_active}
          onChange={e => onToggleActive(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer accent-[var(--color-brand)]"
        />
      </td>
      <td className="block md:table-cell md:p-4 md:text-center pt-3 border-t border-[var(--color-surface-sunken)] md:border-none md:pt-0">
        <div className="flex items-center justify-end md:justify-center gap-2 w-full">
          <button onClick={onEdit}   className="px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors">Edit</button>
          <button onClick={onClone}  className="px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors">Clone</button>
          <button onClick={onDelete} className="px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-red-50 hover:text-red-600 transition-colors">Delete</button>
        </div>
      </td>
    </tr>
  );
}

export default function IngredientEditor() {
  const [ingredients, setIngredients] = useState<IngredientWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<IngType>('protein');
  const [modalIng, setModalIng] = useState<IngredientWithVariants | 'new' | null>(null);
  const [form, setForm] = useState<IngForm>(EMPTY_FORM('protein'));
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<Ingredient>>>({});
  const [pendingReorder, setPendingReorder] = useState(false);
  const [pendingSaving, setPendingSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchIngredients = async () => {
    setLoading(true);
    const [{ data: ings }, { data: variants }] = await Promise.all([
      supabase.from('ingredients').select('*').order('display_order'),
      supabase.from('ingredient_variants').select('*').order('display_order'),
    ]);
    setIngredients(
      (ings ?? []).map(ing => ({
        ...ing,
        variants: (variants ?? []).filter(v => v.ingredient_id === ing.id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => { fetchIngredients(); }, []);

  const visibleIngredients = ingredients.filter(i => i.type === activeType);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleIngredients.findIndex(i => i.id === active.id);
    const newIndex = visibleIngredients.findIndex(i => i.id === over.id);
    const reordered = arrayMove(visibleIngredients, oldIndex, newIndex);

    setIngredients(prev => {
      const others = prev.filter(i => i.type !== activeType);
      return [...others, ...reordered];
    });
    setPendingReorder(true);
  };

  const stageIngChange = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(cur => cur.map(i => i.id === id ? { ...i, ...updates } : i));
    setPendingChanges(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...updates } }));
  };

  const savePendingIngChanges = async () => {
    const fieldEntries = Object.entries(pendingChanges);
    const hasReorder = pendingReorder;
    if (fieldEntries.length === 0 && !hasReorder) return;
    setPendingSaving(true);
    try {
      const reorderWrites = hasReorder
        ? ingredients.map((ing) => {
            const order = ingredients.filter(i => i.type === ing.type).findIndex(i => i.id === ing.id);
            return supabase.from('ingredients').update({ display_order: order }).eq('id', ing.id);
          })
        : [];
      const results = await Promise.all([
        ...fieldEntries.map(([id, updates]) =>
          supabase.from('ingredients').update(updates).eq('id', id),
        ),
        ...reorderWrites,
      ]);
      const failed = results.find(r => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      setPendingChanges({});
      setPendingReorder(false);
    } catch (err) {
      alert(`Error saving: ${(err as Error).message}`);
      fetchIngredients();
    } finally {
      setPendingSaving(false);
    }
  };

  const discardPendingIngChanges = () => {
    setPendingChanges({});
    setPendingReorder(false);
    fetchIngredients();
  };

  const handleDelete = async (ing: IngredientWithVariants) => {
    if (!confirm(`Delete "${ing.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('ingredients').delete().eq('id', ing.id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    fetchIngredients();
  };

  const handleClone = async (ing: IngredientWithVariants) => {
    const sameType = ingredients.filter(i => i.type === ing.type);
    const nextOrder = sameType.length > 0 ? Math.max(...sameType.map(i => i.display_order)) + 1 : 0;
    const { data, error } = await supabase.from('ingredients').insert({
      name: `${ing.name} (copy)`,
      type: ing.type,
      image_url: null,
      calories: ing.calories,
      protein_g: ing.protein_g,
      carbs_g: ing.carbs_g,
      fat_g: ing.fat_g,
      upcharge_cents: ing.upcharge_cents,
      is_active: false,
      available_as_side: ing.available_as_side,
      display_order: nextOrder,
    }).select('id').single();
    if (error) { alert(`Clone failed: ${error.message}`); return; }
    if (ing.variants.length > 0) {
      await supabase.from('ingredient_variants').insert(
        ing.variants.map(v => ({
          ingredient_id: data.id,
          size_label: v.size_label,
          calories: v.calories,
          protein_g: v.protein_g,
          carbs_g: v.carbs_g,
          fat_g: v.fat_g,
          price_cents: v.price_cents,
          is_default: v.is_default,
          display_order: v.display_order,
        })),
      );
    }
    fetchIngredients();
  };

  const openCreate = () => {
    setForm(EMPTY_FORM(activeType));
    setModalIng('new');
  };

  const openEdit = (ing: IngredientWithVariants) => { setForm(ingToForm(ing)); setModalIng(ing); };
  const closeModal = () => setModalIng(null);

  const sf = <K extends keyof IngForm>(field: K, value: IngForm[K]) =>
    setForm(f => ({ ...f, [field]: value } as IngForm));

  const addVariant = () =>
    setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));

  const removeVariant = (index: number) =>
    setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));

  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) =>
    setForm(f => {
      const variants = f.variants.map((v, i) => {
        if (field === 'is_default') return { ...v, is_default: i === index };
        return i === index ? { ...v, [field]: value } : v;
      });
      return { ...f, variants };
    });

  const handleVariantMacroBlur = (index: number) => {
    setForm(f => {
      if (!f.variants[index]?.is_default) return f;
      return { ...f, variants: autofillFromDefault(f.variants) };
    });
  };

  const handleSizeLabelBlur = () =>
    setForm(f => ({ ...f, variants: autofillFromDefault(f.variants) }));

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    const needsVariants = TYPES_WITH_VARIANTS.includes(form.type);
    if (needsVariants && form.variants.length === 0) {
      alert('At least one size variant is required for this ingredient type.');
      return;
    }
    if (needsVariants && form.variants.some(v => !v.size_label.trim())) {
      alert('All variants must have a size label.');
      return;
    }

    const isNew = modalIng === 'new';
    const nextOrder = isNew
      ? (visibleIngredients.length > 0 ? Math.max(...visibleIngredients.map(i => i.display_order)) + 1 : 0)
      : (modalIng as IngredientWithVariants).display_order;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        image_url: null as string | null,
        calories: form.calories ? parseInt(form.calories) : 0,
        protein_g: form.protein_g ? parseFloat(form.protein_g) : 0,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : 0,
        fat_g: form.fat_g ? parseFloat(form.fat_g) : 0,
        upcharge_cents: form.upcharge ? Math.round(parseFloat(form.upcharge) * 100) : 0,
        is_active: form.is_active,
        available_as_side: form.type === 'sauce',
        display_order: nextOrder,
      };

      let ingId: string;
      if (isNew) {
        const { data, error } = await supabase.from('ingredients').insert(payload).select('id').single();
        if (error) throw new Error(error.message);
        ingId = data.id;
      } else {
        ingId = (modalIng as IngredientWithVariants).id;
        const { error } = await supabase.from('ingredients').update(payload).eq('id', ingId);
        if (error) throw new Error(error.message);
      }

      await supabase.from('ingredient_variants').delete().eq('ingredient_id', ingId);
      if (needsVariants && form.variants.length > 0) {
        const { error } = await supabase.from('ingredient_variants').insert(
          form.variants.map((v, i) => ({
            ingredient_id: ingId,
            size_label: v.size_label.trim(),
            calories: parseInt(v.calories) || 0,
            protein_g: parseFloat(v.protein_g) || 0,
            carbs_g: parseFloat(v.carbs_g) || 0,
            fat_g: parseFloat(v.fat_g) || 0,
            price_cents: Math.round(parseFloat(v.price) * 100) || 0,
            is_default: v.is_default,
            display_order: i,
          })),
        );
        if (error) throw new Error(error.message);
      }

      closeModal();
      fetchIngredients();
    } catch (err) {
      alert(`Error saving: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]';
  const labelCls = 'block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1.5';
  const variantInputCls = 'w-full px-2 py-1.5 rounded border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]';

  if (loading) return <div className="text-[var(--color-fg-muted)]">Loading ingredients...</div>;

  return (
    <>
      {(Object.keys(pendingChanges).length > 0 || pendingReorder) && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] text-[13px]">
          <span className="text-amber-800 font-medium">
            Unsaved changes
            {Object.keys(pendingChanges).length > 0 && ` · ${Object.keys(pendingChanges).length} ingredient${Object.keys(pendingChanges).length === 1 ? '' : 's'}`}
            {pendingReorder && ' · order'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={discardPendingIngChanges}
              className="px-3 py-1.5 text-amber-700 hover:text-amber-900 font-medium rounded transition-colors"
            >
              Discard
            </button>
            <button
              onClick={savePendingIngChanges}
              disabled={pendingSaving}
              className="px-4 py-1.5 bg-amber-600 text-white rounded-[var(--radius-pill)] font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {pendingSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <p className="text-[13px] text-[var(--color-fg-subtle)] mb-4 max-w-2xl">
        Proteins, carbs, veggies, sauces, and marinades for the custom meal builder at{' '}
        <span className="font-medium text-[var(--color-fg-muted)]">/customize</span>.
        Builder rules (e.g. max veggies) are under Manage Custom Meals.
      </p>

      {/* Type tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--color-surface-sunken)] p-1 rounded-[var(--radius-input)] w-fit">
        {TYPE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={`px-4 py-1.5 text-[13px] font-medium rounded transition-colors ${activeType === key ? 'bg-[var(--color-surface-elevated)] text-[var(--color-fg)] shadow-sm' : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[var(--color-brand)] text-[var(--color-surface-elevated)] rounded-[var(--radius-pill)] text-[14px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          + New {TYPE_TABS.find(t => t.key === activeType)?.label.slice(0, -1)}
        </button>
      </div>

      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] overflow-hidden">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-[var(--color-surface-sunken)] text-[12px] uppercase text-[var(--color-fg-muted)] tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold text-center w-24" title="Uncheck to hide from the customer builder without deleting.">Visible</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleIngredients.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-[var(--color-surface-sunken)] text-[14px]">
                  {visibleIngredients.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-[var(--color-fg-muted)]">No {activeType}s yet.</td></tr>
                  )}
                  {visibleIngredients.map(ing => (
                    <SortableRow
                      key={ing.id}
                      ing={ing}
                      onEdit={() => openEdit(ing)}
                      onClone={() => handleClone(ing)}
                      onDelete={() => handleDelete(ing)}
                      onToggleActive={val => stageIngChange(ing.id, { is_active: val })}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalIng !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
          <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] shadow-[var(--shadow-rail)] mb-8">

            <div className="flex items-center justify-between p-6 border-b border-[var(--color-surface-sunken)]">
              <h2 className="font-[family-name:var(--font-display)] font-bold text-[20px] text-[var(--color-fg)]">
                {modalIng === 'new'
                  ? `New ${TYPE_TABS.find(t => t.key === activeType)?.label.slice(0, -1)}`
                  : `Edit: ${(modalIng as IngredientWithVariants).name}`}
              </h2>
              <button onClick={closeModal} className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className={labelCls}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => sf('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Chicken Breast"
                />
              </div>

              {/* Single-portion macros (carb, veggie, flavor) */}
              {TYPES_WITH_MACROS.includes(form.type) && (
                <div>
                  <label className={labelCls}>Macros (per serving)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      { field: 'calories',  label: 'Cal',     step: '1',   placeholder: '80'  },
                      { field: 'protein_g', label: 'Protein', step: '0.1', placeholder: '5'   },
                      { field: 'carbs_g',   label: 'Carbs',   step: '0.1', placeholder: '12'  },
                      { field: 'fat_g',     label: 'Fat',     step: '0.1', placeholder: '3'   },
                    ] as const).map(({ field, label, step, placeholder }) => (
                      <div key={field}>
                        <span className="block text-[11px] text-[var(--color-fg-subtle)] mb-1">{label}</span>
                        <input
                          type="number"
                          step={step}
                          min="0"
                          value={form[field]}
                          onChange={e => sf(field, e.target.value)}
                          className={variantInputCls}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcharge (carb only) */}
              {TYPES_WITH_UPCHARGE.includes(form.type) && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls} title="Added to the meal price when the customer picks this carb.">Upcharge</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--color-fg-muted)] text-[14px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.upcharge}
                        onChange={e => sf('upcharge', e.target.value)}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Universal variant editor (protein + sauce) */}
              {TYPES_WITH_VARIANTS.includes(form.type) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + ' mb-0'}>
                      {form.type === 'protein' ? 'Size Variants' : 'Size Options'} — price & macros per size
                    </label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="text-[12px] font-medium text-[var(--color-brand)] hover:underline"
                    >
                      + Add size
                    </button>
                  </div>

                  {form.variants.length === 0 ? (
                    <p className="text-[13px] text-[var(--color-fg-subtle)] py-3">No sizes yet — click "Add size" above.</p>
                  ) : (
                    <div className="border border-[var(--color-surface-sunken)] rounded-[var(--radius-input)] overflow-hidden">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-[12px] whitespace-nowrap min-w-max">
                        <thead>
                          <tr className="bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)]">
                            <th className="p-2 text-left font-semibold">Size label</th>
                            <th className="p-2 text-left font-semibold">Cal</th>
                            <th className="p-2 text-left font-semibold">Protein</th>
                            <th className="p-2 text-left font-semibold">Carbs</th>
                            <th className="p-2 text-left font-semibold">Fat</th>
                            <th className="p-2 text-left font-semibold">Price</th>
                            <th className="p-2 text-center font-semibold" title="The size pre-selected when the ingredient is first picked.">Default</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-surface-sunken)]">
                          {form.variants.map((v, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-surface-elevated)]' : 'bg-[var(--color-surface-base)]/50'}>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={v.size_label}
                                  onChange={e => updateVariant(i, 'size_label', e.target.value)}
                                  onBlur={handleSizeLabelBlur}
                                  className={variantInputCls}
                                  placeholder="e.g. 6 oz"
                                />
                              </td>
                              {(['calories','protein_g','carbs_g','fat_g'] as const).map(f => (
                                <td key={f} className="p-1.5">
                                  <input
                                    type="number"
                                    step={f === 'calories' ? '1' : '0.1'}
                                    min="0"
                                    value={v[f]}
                                    onChange={e => updateVariant(i, f, e.target.value)}
                                    onBlur={() => handleVariantMacroBlur(i)}
                                    className={variantInputCls}
                                  />
                                </td>
                              ))}
                              <td className="p-1.5">
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[var(--color-fg-muted)]">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={v.price}
                                    onChange={e => updateVariant(i, 'price', e.target.value)}
                                    className={variantInputCls}
                                  />
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="radio"
                                  name="variant-default"
                                  checked={v.is_default}
                                  onChange={() => updateVariant(i, 'is_default', true)}
                                  className="w-4 h-4 accent-[var(--color-brand)] cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(i)}
                                  className="text-[var(--color-fg-subtle)] hover:text-red-500 transition-colors"
                                  title="Remove this size"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                      <p className="text-[11px] text-[var(--color-fg-subtle)] px-3 py-2 border-t border-[var(--color-surface-sunken)]">
                        Macros on the default size auto-fill other sizes on blur (scales by oz ratio). Price is always manual.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Visible toggle */}
              <label className="flex items-center gap-2 cursor-pointer" title="Uncheck to hide from the customer builder without deleting this ingredient.">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => sf('is_active', e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--color-brand)]"
                />
                <span className="text-[14px] text-[var(--color-fg)]">Visible in builder</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-surface-sunken)]">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-[14px] font-medium rounded-[var(--radius-pill)] border border-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:border-[var(--color-fg-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2.5 text-[14px] font-semibold rounded-[var(--radius-pill)] transition-colors ${saving ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)]' : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'}`}
              >
                {saving ? 'Saving…' : modalIng === 'new' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
