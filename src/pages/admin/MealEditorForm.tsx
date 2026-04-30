import { useRef, useState } from 'react';
import type { MealDraft, MealRow } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

type MealEditorFormProps = {
    meal: MealRow;
    draft: MealDraft;
    updateDraft: (patch: Partial<MealDraft>) => void;
    setNutritionOverride: (value: boolean) => void;
    onDelete: () => void;
    supabase: SupabaseClient;
};

export default function MealEditorForm({ meal, draft, updateDraft, setNutritionOverride, onDelete, supabase }: MealEditorFormProps) {
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
                console.error("Upload error:", uploadError);
                alert("Failed to upload image.");
                return;
            }

            const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
            updateDraft({ image: data.publicUrl });
        } catch (err) {
            console.error("Upload failed:", err);
            alert("An error occurred during upload.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="admin-expanded-form admin-meal-modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="admin-expanded-grid">
                <div className="admin-upload-zone">
                    <div className="admin-upload-frame">
                        <img src={draft.image || meal.image} alt="" className="admin-upload-preview" />
                        <button
                            type="button"
                            className="admin-upload-replace"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="admin-visually-hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <div className="admin-expanded-fields">
                    <div className="admin-title-price-row">
                        <div>
                            <label className="admin-field-label">Title</label>
                            <input
                                className="admin-input admin-meals-input"
                                value={draft.title}
                                onChange={(e) => updateDraft({ title: e.target.value })}
                            />
                        </div>
                        <div className="admin-price-input-wrap">
                            <label className="admin-field-label">Price</label>
                            <div className="admin-price-input-inner">
                                <span className="admin-price-currency" aria-hidden>$</span>
                                <input
                                    className="admin-input admin-meals-input"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={draft.price}
                                    onChange={(e) => updateDraft({ price: Number(e.target.value) })}
                                    aria-label="Price in dollars"
                                />
                            </div>
                        </div>
                    </div>
                    <label className="admin-field-label">Description</label>
                    <textarea
                        className="admin-textarea admin-meals-textarea"
                        rows={3}
                        value={draft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                    />
                    <div className="admin-nutrition-card">
                        <div className="admin-nutrition-head">
                            <span className="admin-nutrition-eyebrow">Nutrition · from stored values</span>
                            <button
                                type="button"
                                className="admin-link-btn"
                                onClick={() => setNutritionOverride(!draft.nutritionOverride)}
                            >
                                {draft.nutritionOverride ? 'Use computed' : 'Override manually'}
                            </button>
                        </div>
                        <p className="admin-nutrition-hint">
                            Numbers shown here are what the site uses (same fields as the database). Override if you need
                            custom macros.
                        </p>
                        <div className="admin-nutrition-tiles">
                            {(
                                [
                                    { key: 'protein' as const, label: 'Protein' },
                                    { key: 'carbs' as const, label: 'Carbs' },
                                    { key: 'fat' as const, label: 'Fat' },
                                    { key: 'calories' as const, label: 'Calories' }
                                ] as const
                            ).map(({ key, label }) => {
                                const display = draft.nutritionOverride ? draft[key] : meal[key];
                                const unit = key === 'calories' ? '' : 'g';
                                return (
                                    <div key={key} className="admin-nutrition-tile">
                                        <span className="admin-nutrition-tile-label">{label}</span>
                                        {draft.nutritionOverride ? (
                                            <input
                                                className="admin-input admin-nutrition-tile-input"
                                                type="number"
                                                min={0}
                                                value={draft[key]}
                                                onChange={(e) => updateDraft({ [key]: Number(e.target.value) } as Partial<MealDraft>)}
                                            />
                                        ) : (
                                            <span className="admin-nutrition-tile-value">
                                                {display}
                                                {unit && <span className="admin-nutrition-tile-unit">{unit}</span>}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="admin-expanded-footer">
                        <div className="admin-segmented-wrap">
                            <div className="admin-segmented">
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
                            <span className="admin-status-hint">
                                {draft.is_active ? 'Visible to customers on the home page.' : 'Hidden from customers — only visible in admin.'}
                            </span>
                        </div>
                        <span className="admin-id-readonly">ID: {meal.id}</span>
                        <button type="button" className="admin-delete-link" onClick={onDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
