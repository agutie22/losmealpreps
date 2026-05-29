import React, { useEffect, useRef, useState } from 'react';
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

type Meal = Database['public']['Tables']['meals']['Row'];

interface MealForm {
  name: string;
  description: string;
  category: string;
  meal_type: 'staple' | 'weekly';
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  price: string;
  is_active: boolean;
  is_featured: boolean;
  hero_image_url: string;
}

const EMPTY_FORM: MealForm = {
  name: '', description: '', category: '',
  meal_type: 'weekly', calories: '', protein_g: '', carbs_g: '', fat_g: '',
  price: '', is_active: true, is_featured: false, hero_image_url: '',
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mealToForm(meal: Meal): MealForm {
  return {
    name: meal.name,
    description: meal.description,
    category: meal.category,
    meal_type: meal.meal_type as 'staple' | 'weekly',
    calories: meal.calories ? String(meal.calories) : '',
    protein_g: Number(meal.protein_g) ? String(meal.protein_g) : '',
    carbs_g: Number(meal.carbs_g) ? String(meal.carbs_g) : '',
    fat_g: Number(meal.fat_g) ? String(meal.fat_g) : '',
    price: centsToDecimal(meal.base_price_cents),
    is_active: meal.is_active,
    is_featured: meal.is_featured,
    hero_image_url: meal.hero_image_url,
  };
}

const MACRO_FIELDS = [
  { field: 'calories',  label: 'Calories',    placeholder: '450', step: '1'   },
  { field: 'protein_g', label: 'Protein (g)',  placeholder: '35',  step: '0.1' },
  { field: 'carbs_g',   label: 'Carbs (g)',    placeholder: '40',  step: '0.1' },
  { field: 'fat_g',     label: 'Fat (g)',      placeholder: '15',  step: '0.1' },
] as const;

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
      <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
      <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  );
}

function SortableMealRow({
  meal,
  onEdit,
  onDelete,
  onStageChange,
}: {
  meal: Meal;
  onEdit: () => void;
  onDelete: () => void;
  onStageChange: (updates: Partial<Meal>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: meal.id });

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
      <td className="block md:table-cell md:p-4 font-bold md:font-medium text-[16px] md:text-[14px] text-[var(--color-fg)] mb-3 md:mb-0 pr-8 md:pr-0">
        {meal.name}
        {meal.hero_image_url && (
          <span className="block text-[11px] text-[var(--color-fg-subtle)] font-normal mt-1 truncate max-w-[200px]">
            Has Hero Image
          </span>
        )}
      </td>
      <td className="flex justify-between items-center md:table-cell md:p-4 text-[var(--color-fg-muted)] mb-2 md:mb-0 text-[13px] md:text-[14px]">
        <span className="md:hidden font-medium text-[var(--color-fg)]">Category</span>
        <span>{meal.category}</span>
      </td>
      <td className="flex justify-between items-center md:table-cell md:p-4 mb-2 md:mb-0">
        <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Price</span>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-fg-muted)]">$</span>
          <input
            key={meal.base_price_cents}
            type="number"
            step="0.01"
            className="w-20 px-2 py-1 rounded bg-[var(--color-surface-base)] border border-[var(--color-surface-sunken)] text-[var(--color-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            defaultValue={centsToDecimal(meal.base_price_cents)}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && Math.round(val * 100) !== meal.base_price_cents) {
                onStageChange({ base_price_cents: Math.round(val * 100) });
              }
            }}
          />
        </div>
      </td>
      <td className="flex justify-between items-center md:table-cell md:p-4 md:text-center mb-2 md:mb-0">
        <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Active</span>
        <input
          type="checkbox"
          checked={meal.is_active}
          onChange={(e) => onStageChange({ is_active: e.target.checked })}
          className="w-4 h-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer accent-[var(--color-brand)]"
        />
      </td>
      <td className="flex justify-between items-center md:table-cell md:p-4 md:text-center mb-4 md:mb-0">
        <span className="md:hidden font-medium text-[var(--color-fg)] text-[13px]">Featured</span>
        <input
          type="checkbox"
          checked={meal.is_featured}
          onChange={(e) => onStageChange({ is_featured: e.target.checked })}
          className="w-4 h-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer accent-[var(--color-brand)]"
        />
      </td>
      <td className="block md:table-cell md:p-4 md:text-center pt-3 border-t border-[var(--color-surface-sunken)] md:border-none md:pt-0">
        <div className="flex items-center justify-end md:justify-center gap-2 w-full">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-[12px] font-medium rounded bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MealEditor() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMeal, setModalMeal] = useState<Meal | 'new' | null>(null);
  const [form, setForm] = useState<MealForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<Meal>>>({});
  const [pendingReorder, setPendingReorder] = useState(false);
  const [pendingSaving, setPendingSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchMeals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('meals').select('*').order('display_order');
    if (error) {
      // display_order column may not exist yet — fall back to name order
      const { data: fallback } = await supabase.from('meals').select('*').order('name');
      if (fallback) setMeals(fallback);
    } else if (data) {
      setMeals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = meals.findIndex(m => m.id === active.id);
    const newIndex = meals.findIndex(m => m.id === over.id);
    setMeals(prev => arrayMove(prev, oldIndex, newIndex));
    setPendingReorder(true);
  };

  const stageMealChange = (id: string, updates: Partial<Meal>) => {
    setMeals(current => current.map(m => m.id === id ? { ...m, ...updates } : m));
    setPendingChanges(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...updates } }));
  };

  const savePendingMealChanges = async () => {
    const fieldEntries = Object.entries(pendingChanges);
    const hasReorder = pendingReorder;
    if (fieldEntries.length === 0 && !hasReorder) return;
    setPendingSaving(true);
    try {
      const reorderWrites = hasReorder
        ? meals.map((meal, idx) =>
            supabase.from('meals').update({ display_order: idx }).eq('id', meal.id),
          )
        : [];
      const results = await Promise.all([
        ...fieldEntries.map(([id, updates]) => supabase.from('meals').update(updates).eq('id', id)),
        ...reorderWrites,
      ]);
      const failed = results.find(r => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      setPendingChanges({});
      setPendingReorder(false);
    } catch (err) {
      alert(`Error saving: ${(err as Error).message}`);
      fetchMeals();
    } finally {
      setPendingSaving(false);
    }
  };

  const discardPendingMealChanges = () => {
    setPendingChanges({});
    setPendingReorder(false);
    fetchMeals();
  };

  const handleDelete = async (meal: Meal) => {
    if (!confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('meals').delete().eq('id', meal.id);
    if (error) { alert(`Error deleting meal: ${error.message}`); return; }
    fetchMeals();
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setModalMeal('new');
  };

  const openEdit = (meal: Meal) => {
    setForm(mealToForm(meal));
    setImageFile(null);
    setImagePreview(meal.hero_image_url);
    setModalMeal(meal);
  };

  const closeModal = () => {
    setModalMeal(null);
    setImageFile(null);
    setImagePreview('');
  };

  const setField = <K extends keyof MealForm>(field: K, value: MealForm[K]) =>
    setForm(f => ({ ...f, [field]: value } as MealForm));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { alert('Image must be under 5 MB.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File, slug: string): Promise<string> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('meal-photos')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('meal-photos').getPublicUrl(path);
    return publicUrl;
  };

  const handleSave = async () => {
    const isNew = modalMeal === 'new';
    if (!form.name.trim())     { alert('Name is required.');     return; }
    if (!form.category.trim()) { alert('Category is required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { alert('Enter a valid price.'); return; }
    if (isNew && !imageFile)   { alert('An image is required for new meals.'); return; }

    setSaving(true);
    try {
      let heroUrl = form.hero_image_url;
      if (imageFile) heroUrl = await uploadImage(imageFile, toSlug(form.name.trim()));

      const nextOrder = isNew
        ? (meals.length > 0 ? Math.max(...meals.map(m => m.display_order)) + 1 : 0)
        : (modalMeal as Meal).display_order;

      const payload = {
        name:             form.name.trim(),
        slug:             toSlug(form.name.trim()), // trigger overwrites this; satisfies not-null type
        description:      form.description.trim(),
        category:         form.category.trim(),
        meal_type:        form.meal_type,
        calories:         form.calories  ? parseInt(form.calories, 10)    : 0,
        protein_g:        form.protein_g ? parseFloat(form.protein_g)     : 0,
        carbs_g:          form.carbs_g   ? parseFloat(form.carbs_g)       : 0,
        fat_g:            form.fat_g     ? parseFloat(form.fat_g)         : 0,
        base_price_cents: Math.round(price * 100),
        is_active:        form.is_active,
        is_featured:      form.is_featured,
        hero_image_url:   heroUrl,
        display_order:    nextOrder,
      };

      if (isNew) {
        const { error } = await supabase.from('meals').insert(payload);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('meals').update(payload).eq('id', (modalMeal as Meal).id);
        if (error) throw new Error(error.message);
      }

      closeModal();
      fetchMeals();
    } catch (err) {
      alert(`Error saving meal: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-[var(--color-fg-muted)]">Loading meals...</div>;

  const inputCls = 'w-full px-3 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]';
  const labelCls = 'block text-[12px] font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-1.5';

  const hasPending = Object.keys(pendingChanges).length > 0 || pendingReorder;

  return (
    <>
      {hasPending && (
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] text-[13px]">
          <span className="text-amber-800 font-medium">
            Unsaved changes
            {Object.keys(pendingChanges).length > 0 && ` · ${Object.keys(pendingChanges).length} meal${Object.keys(pendingChanges).length === 1 ? '' : 's'}`}
            {pendingReorder && ' · order'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={discardPendingMealChanges}
              className="px-3 py-1.5 text-amber-700 hover:text-amber-900 font-medium rounded transition-colors"
            >
              Discard
            </button>
            <button
              onClick={savePendingMealChanges}
              disabled={pendingSaving}
              className="px-4 py-1.5 bg-amber-600 text-white rounded-[var(--radius-pill)] font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {pendingSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[var(--color-brand)] text-[var(--color-surface-elevated)] rounded-[var(--radius-pill)] text-[14px] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          + New Meal
        </button>
      </div>

      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] overflow-hidden">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-[var(--color-surface-sunken)] text-[12px] uppercase text-[var(--color-fg-muted)] tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-4 font-semibold">Meal Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold text-center">Active</th>
                <th className="p-4 font-semibold text-center">Featured</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={meals.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-[var(--color-surface-sunken)] text-[14px]">
                  {meals.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-[var(--color-fg-muted)]">No meals yet.</td></tr>
                  )}
                  {meals.map(meal => (
                    <SortableMealRow
                      key={meal.id}
                      meal={meal}
                      onEdit={() => openEdit(meal)}
                      onDelete={() => handleDelete(meal)}
                      onStageChange={(updates) => stageMealChange(meal.id, updates)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      </div>

      {modalMeal !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
          <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] shadow-[var(--shadow-rail)] mb-8">

            <div className="flex items-center justify-between p-6 border-b border-[var(--color-surface-sunken)]">
              <h2 className="font-[family-name:var(--font-display)] font-bold text-[20px] text-[var(--color-fg)]">
                {modalMeal === 'new' ? 'New Meal' : `Edit: ${(modalMeal as Meal).name}`}
              </h2>
              <button onClick={closeModal} className="text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className={labelCls}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="Grilled Chicken Bowl"
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="A hearty bowl with..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Category *</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setField('category', e.target.value)}
                    className={inputCls}
                    placeholder="Chicken"
                  />
                </div>
                <div>
                  <label className={labelCls}>Meal Type</label>
                  <select
                    value={form.meal_type}
                    onChange={e => setField('meal_type', e.target.value as 'staple' | 'weekly')}
                    className={inputCls}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="staple">Staple</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price *</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--color-fg-muted)] text-[14px]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e => setField('price', e.target.value)}
                      className={inputCls}
                      placeholder="12.99"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Macros</label>
                <div className="grid grid-cols-4 gap-3">
                  {MACRO_FIELDS.map(({ field, label, placeholder, step }) => (
                    <div key={field}>
                      <span className="block text-[11px] text-[var(--color-fg-subtle)] mb-1">{label}</span>
                      <input
                        type="number"
                        step={step}
                        min="0"
                        value={form[field]}
                        onChange={e => setField(field, e.target.value)}
                        className="w-full px-2 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Hero Image{modalMeal === 'new' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-[var(--color-surface-sunken)] flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-[13px] font-medium rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
                    >
                      {imagePreview ? 'Change image' : 'Upload image'}
                    </button>
                    <p className="text-[11px] text-[var(--color-fg-subtle)] mt-1.5">JPEG or PNG, max 5 MB</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setField('is_active', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--color-brand)]"
                  />
                  <span className="text-[14px] text-[var(--color-fg)]">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setField('is_featured', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--color-brand)]"
                  />
                  <span className="text-[14px] text-[var(--color-fg)]">Featured</span>
                </label>
              </div>
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
                {saving ? 'Saving…' : modalMeal === 'new' ? 'Create Meal' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
