import { useMemo, useRef, useState } from 'react';
import type { MealDraft, MealRow, IngredientRow } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

type MealEditorFormProps = {
    meal: MealRow;
    draft: MealDraft;
    updateDraft: (patch: Partial<MealDraft>) => void;
    onDelete: () => void;
    supabase: SupabaseClient;
    availableIngredients: IngredientRow[];
};

function calcMacros(ids: string[], ingredients: IngredientRow[]) {
    const map = new Map(ingredients.map(i => [i.id, i]));
    return ids.reduce((acc, id) => {
        const ing = map.get(id);
        if (!ing) return acc;
        return {
            protein: acc.protein + ing.protein,
            carbs: acc.carbs + ing.carbs,
            fat: acc.fat + ing.fat,
            calories: acc.calories + ing.calories
        };
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });
}

function autoDesc(ids: string[], ingredients: IngredientRow[]) {
    const map = new Map(ingredients.map(i => [i.id, i]));
    return ids.map(id => map.get(id)?.name).filter(Boolean).join(' · ');
}

const CATEGORIES: Array<{ key: IngredientRow['category']; label: string; optional: boolean }> = [
    { key: 'protein', label: 'Protein', optional: false },
    { key: 'carb', label: 'Carb', optional: true },
    { key: 'veggie', label: 'Veggie', optional: true },
    { key: 'sauce', label: 'Sauce', optional: true },
];

export default function MealEditorForm({
    meal,
    draft,
    updateDraft,
    onDelete,
    supabase,
    availableIngredients
}: MealEditorFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Failed to upload image.');
                return;
            }

            const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
            updateDraft({ image: data.publicUrl });
        } catch (err) {
            console.error('Upload failed:', err);
            alert('An error occurred during upload.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Build category → ingredients map
    const byCategory = useMemo(
        () =>
            CATEGORIES.reduce<Record<string, IngredientRow[]>>((acc, { key }) => {
                acc[key] = availableIngredients.filter(i => i.category === key && i.is_active);
                return acc;
            }, {}),
        [availableIngredients]
    );

    // Which ingredient is selected per category (from ingredient_ids)
    const selectedByCategory = useMemo(() => {
        const result: Record<string, string | null> = {};
        for (const { key } of CATEGORIES) {
            const found = draft.ingredient_ids.find(id =>
                byCategory[key]?.some(i => i.id === id)
            );
            result[key] = found ?? null;
        }
        return result;
    }, [draft.ingredient_ids, byCategory]);

    const calculatedMacros = useMemo(
        () => calcMacros(draft.ingredient_ids, availableIngredients),
        [draft.ingredient_ids, availableIngredients]
    );

    const generatedDescription = useMemo(
        () => autoDesc(draft.ingredient_ids, availableIngredients),
        [draft.ingredient_ids, availableIngredients]
    );

    const handleChipClick = (category: IngredientRow['category'], ingredientId: string | null) => {
        // Build new ingredient_ids: remove any in this category, then optionally add new one
        const categoryIds = new Set((byCategory[category] ?? []).map(i => i.id));
        const filtered = draft.ingredient_ids.filter(id => !categoryIds.has(id));
        const newIds = ingredientId ? [...filtered, ingredientId] : filtered;

        const patch: Partial<MealDraft> = { ingredient_ids: newIds };

        if (!draft.nutritionOverride) {
            const macros = calcMacros(newIds, availableIngredients);
            Object.assign(patch, macros);
        }

        updateDraft(patch);
    };

    const currentImage = draft.image || meal.image;
    const showAutoDescBtn =
        draft.ingredient_ids.length > 0 && generatedDescription !== draft.description;

    // Macros to display
    const displayMacros = (!draft.nutritionOverride && draft.ingredient_ids.length > 0)
        ? calculatedMacros
        : { protein: draft.protein, carbs: draft.carbs, fat: draft.fat, calories: draft.calories };

    return (
        <div className="meal-editor admin-meal-modal-form">
            {/* 1. Photo */}
            <div
                className="meal-editor-photo-frame"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                aria-label="Upload photo"
            >
                {currentImage ? (
                    <>
                        <img src={currentImage} alt={draft.title} />
                        <button
                            type="button"
                            className="meal-editor-photo-btn"
                            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading…' : 'Replace'}
                        </button>
                    </>
                ) : (
                    <div className="meal-editor-photo-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        {isUploading ? 'Uploading…' : 'Upload photo'}
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* 2. Title + Price row */}
            <div className="meal-editor-row">
                <div className="meal-editor-field meal-editor-field--grow">
                    <label className="meal-editor-label">Title</label>
                    <input
                        className="meal-editor-input"
                        value={draft.title}
                        onChange={e => updateDraft({ title: e.target.value })}
                    />
                </div>
                <div className="meal-editor-field meal-editor-field--price">
                    <label className="meal-editor-label">Price</label>
                    <div className="meal-editor-price-wrap">
                        <span>$</span>
                        <input
                            className="meal-editor-input"
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.price}
                            onChange={e => updateDraft({ price: Number(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Description */}
            <div className="meal-editor-field">
                <div className="meal-editor-label-row">
                    <label className="meal-editor-label">Description</label>
                    {showAutoDescBtn && (
                        <button
                            type="button"
                            className="meal-editor-link-btn"
                            onClick={() => updateDraft({ description: generatedDescription })}
                        >
                            ← Use ingredient names
                        </button>
                    )}
                </div>
                <textarea
                    className="meal-editor-textarea"
                    rows={2}
                    value={draft.description}
                    onChange={e => updateDraft({ description: e.target.value })}
                />
            </div>

            {/* 4. Composition — ingredient chip-picker */}
            <div className="meal-editor-section">
                <span className="meal-editor-section-label">Composition</span>
                {CATEGORIES.map(({ key, label, optional }) => {
                    const categoryIngredients = byCategory[key] ?? [];
                    const selectedId = selectedByCategory[key];
                    return (
                        <div key={key} className="meal-editor-ingredient-group">
                            <span className="meal-editor-ingredient-group-label">
                                {label}
                                {optional && <span className="meal-editor-optional">optional</span>}
                            </span>
                            <div className="meal-editor-chips">
                                {optional && (
                                    <button
                                        type="button"
                                        className={`meal-editor-chip meal-editor-chip--none${selectedId === null ? ' selected' : ''}`}
                                        onClick={() => handleChipClick(key, null)}
                                    >
                                        None
                                    </button>
                                )}
                                {categoryIngredients.map(ing => (
                                    <button
                                        key={ing.id}
                                        type="button"
                                        className={`meal-editor-chip${selectedId === ing.id ? ' selected' : ''}`}
                                        onClick={() => {
                                            if (selectedId === ing.id && optional) {
                                                // deselect
                                                handleChipClick(key, null);
                                            } else {
                                                handleChipClick(key, ing.id);
                                            }
                                        }}
                                    >
                                        {ing.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 5. Macros */}
            <div className="meal-editor-section">
                <div className="meal-editor-macros-head">
                    <span className="meal-editor-section-label">Macros</span>
                    <button
                        type="button"
                        className="meal-editor-link-btn"
                        onClick={() => updateDraft({ nutritionOverride: !draft.nutritionOverride })}
                    >
                        {draft.nutritionOverride ? '← Use ingredients' : 'Edit manually'}
                    </button>
                </div>
                <div className="meal-editor-macro-tiles">
                    {(
                        [
                            { key: 'protein' as const, label: 'Protein', unit: 'g' },
                            { key: 'carbs' as const, label: 'Carbs', unit: 'g' },
                            { key: 'fat' as const, label: 'Fat', unit: 'g' },
                            { key: 'calories' as const, label: 'Cal', unit: '' },
                        ] as const
                    ).map(({ key, label, unit }) => (
                        <div key={key} className="meal-editor-macro-tile">
                            <span className="meal-editor-macro-label">{label}</span>
                            {draft.nutritionOverride ? (
                                <input
                                    className="meal-editor-macro-input"
                                    type="number"
                                    min={0}
                                    value={draft[key]}
                                    onChange={e =>
                                        updateDraft({ [key]: Number(e.target.value) } as Partial<MealDraft>)
                                    }
                                />
                            ) : (
                                <span className="meal-editor-macro-value">
                                    {displayMacros[key]}
                                    {unit && <span className="meal-editor-macro-unit">{unit}</span>}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. Footer */}
            <div className="meal-editor-footer">
                <div className="meal-editor-segmented">
                    <button
                        type="button"
                        className={draft.is_active ? 'active' : ''}
                        onClick={() => updateDraft({ is_active: true })}
                    >
                        Live
                    </button>
                    <button
                        type="button"
                        className={!draft.is_active ? 'active' : ''}
                        onClick={() => updateDraft({ is_active: false })}
                    >
                        Draft
                    </button>
                </div>
                <button type="button" className="meal-editor-delete-btn" onClick={onDelete}>
                    Delete meal
                </button>
            </div>
        </div>
    );
}
