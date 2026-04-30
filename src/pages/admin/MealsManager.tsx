import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DraggableAttributes,
    type DraggableSyntheticListeners
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import AdminModal from '../../components/admin/AdminModal';
import MealEditorForm from './MealEditorForm';
import type { MealDraft, MealRow } from './types';

type DeleteToast = {
    mealId: string;
    title: string;
    timeoutId: number;
};

type MealsManagerProps = {
    meals: MealRow[];
    setMeals: Dispatch<SetStateAction<MealRow[]>>;
    mealQuery: string;
    setMealQuery: (value: string) => void;
    supabase: SupabaseClient;
    refreshMenu: () => Promise<void>;
    setMessage: (value: string | null) => void;
    loading: boolean;
    reloadMeals: () => Promise<void>;
};

function DragHandleIcon() {
    return (
        <svg className="admin-meals-drag-icon" width="10" height="16" viewBox="0 0 10 16" aria-hidden>
            <circle cx="2" cy="3" r="1.2" fill="currentColor" />
            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
            <circle cx="2" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="2" cy="13" r="1.2" fill="currentColor" />
            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
        </svg>
    );
}

const NUTRITION_OVERRIDE_KEY = 'admin_meal_nutrition_overrides_v1';

function readNutritionOverrides(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(NUTRITION_OVERRIDE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, boolean>;
    } catch {
        return {};
    }
}

function writeNutritionOverrides(value: Record<string, boolean>) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NUTRITION_OVERRIDE_KEY, JSON.stringify(value));
}

function formatPrice(value: number): string {
    return `$${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;
}

function createDraft(meal: MealRow, nutritionOverride: boolean): MealDraft {
    return {
        title: meal.title,
        description: meal.description,
        image: meal.image,
        price: meal.price,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        calories: meal.calories,
        is_active: meal.is_active,
        nutritionOverride,
        ingredient_ids: meal.ingredient_ids
    };
}

function SortableMealRow({
    id,
    disabled,
    children
}: {
    id: string;
    disabled?: boolean;
    children: (args: {
        setNodeRef: (element: HTMLElement | null) => void;
        style: React.CSSProperties;
        dragAttributes: DraggableAttributes;
        dragListeners: DraggableSyntheticListeners;
        isDragging: boolean;
    }) => React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1
    };
    return children({
        setNodeRef,
        style,
        dragAttributes: attributes as unknown as DraggableAttributes,
        dragListeners: listeners,
        isDragging
    });
}

export default function MealsManager({
    meals,
    setMeals,
    mealQuery,
    setMealQuery,
    supabase,
    refreshMenu,
    setMessage,
    loading,
    reloadMeals
}: MealsManagerProps) {
    const [editingMealId, setEditingMealId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, MealDraft>>({});
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [pendingNewIds, setPendingNewIds] = useState<Set<string>>(new Set());
    const [orderIds, setOrderIds] = useState<string[]>([]);
    const [deleteToasts, setDeleteToasts] = useState<DeleteToast[]>([]);
    const [savingMeals, setSavingMeals] = useState(false);
    const [overrideMap, setOverrideMap] = useState<Record<string, boolean>>(() => readNutritionOverrides());
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');
    const newRowRefs = useRef<Record<string, HTMLLIElement | null>>({});

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const mealsById = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals]);
    const sortedMeals = useMemo(
        () => [...meals].sort((a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id)),
        [meals]
    );

    // Keep order ids and draft map keys in sync when server `meals` list changes.
    /* eslint-disable react-hooks/set-state-in-effect -- batch sync from props; functional updaters avoid redundant writes */
    useEffect(() => {
        const nextOrder = sortedMeals.map((m) => m.id);
        setOrderIds((prev) => {
            const prevSet = new Set(prev);
            const sameMembers = prev.length === nextOrder.length && nextOrder.every((id) => prevSet.has(id));
            return sameMembers ? prev : nextOrder;
        });
        setDrafts((prev) => {
            const next: Record<string, MealDraft> = {};
            Object.entries(prev).forEach(([id, draft]) => {
                if (mealsById.has(id)) next[id] = draft;
            });
            return next;
        });
        setDeletedIds((prev) => {
            const next = new Set<string>();
            prev.forEach((id) => {
                if (mealsById.has(id)) next.add(id);
            });
            return next;
        });
    }, [sortedMeals, mealsById]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        writeNutritionOverrides(overrideMap);
    }, [overrideMap]);

    useEffect(() => () => {
        deleteToasts.forEach((toast) => window.clearTimeout(toast.timeoutId));
    }, [deleteToasts]);

    const orderedMeals = useMemo(() => orderIds.map((id) => mealsById.get(id)).filter(Boolean) as MealRow[], [orderIds, mealsById]);

    const filteredMeals = useMemo(() => {
        const query = mealQuery.toLowerCase();
        return orderedMeals.filter((meal) => {
            if (deletedIds.has(meal.id)) return false;
            const matchText = meal.title.toLowerCase().includes(query) || meal.id.toLowerCase().includes(query);
            if (!matchText) return false;
            const draft = drafts[meal.id] ?? createDraft(meal, overrideMap[meal.id] ?? false);
            if (statusFilter === 'live') return draft.is_active;
            if (statusFilter === 'draft') return !draft.is_active;
            return true;
        });
    }, [orderedMeals, deletedIds, mealQuery, statusFilter, drafts, overrideMap, mealsById]);

    const dndEnabled = statusFilter === 'all' && mealQuery.trim() === '';

    const getDraft = useCallback(
        (meal: MealRow): MealDraft => drafts[meal.id] ?? createDraft(meal, overrideMap[meal.id] ?? false),
        [drafts, overrideMap]
    );

    const isMealFieldDirty = useCallback(
        (meal: MealRow): boolean => {
            if (pendingNewIds.has(meal.id)) return true;
            const draft = getDraft(meal);
            const protein = draft.nutritionOverride ? draft.protein : meal.protein;
            const carbs = draft.nutritionOverride ? draft.carbs : meal.carbs;
            const fat = draft.nutritionOverride ? draft.fat : meal.fat;
            const calories = draft.nutritionOverride ? draft.calories : meal.calories;
            return (
                draft.title !== meal.title ||
                draft.description !== meal.description ||
                draft.image !== meal.image ||
                draft.price !== meal.price ||
                draft.is_active !== meal.is_active ||
                protein !== meal.protein ||
                carbs !== meal.carbs ||
                fat !== meal.fat ||
                calories !== meal.calories
            );
        },
        [getDraft, pendingNewIds]
    );

    const orderDirtyMealIds = useMemo(() => {
        const visibleOrder = orderIds.filter((id) => !deletedIds.has(id));
        return visibleOrder.filter((id, idx) => {
            const meal = mealsById.get(id);
            if (!meal) return false;
            return meal.display_order !== idx + 1;
        });
    }, [orderIds, deletedIds, mealsById]);

    const dirtyMealIds = useMemo(() => {
        const ids = new Set<string>();
        meals.forEach((meal) => {
            if (isMealFieldDirty(meal)) ids.add(meal.id);
        });
        orderDirtyMealIds.forEach((id) => ids.add(id));
        deletedIds.forEach((id) => ids.add(id));
        return ids;
    }, [meals, orderDirtyMealIds, deletedIds, isMealFieldDirty]);

    const totalDirty = dirtyMealIds.size;

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (totalDirty === 0) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [totalDirty]);

    const openMealEditor = (id: string) => setEditingMealId(id);
    const closeMealEditor = () => setEditingMealId(null);

    const updateDraft = (meal: MealRow, patch: Partial<MealDraft>) => {
        setDrafts((prev) => {
            const existing = prev[meal.id] ?? createDraft(meal, overrideMap[meal.id] ?? false);
            return { ...prev, [meal.id]: { ...existing, ...patch } };
        });
    };

    const setNutritionOverride = (meal: MealRow, value: boolean) => {
        setOverrideMap((prev) => ({ ...prev, [meal.id]: value }));
        updateDraft(meal, { nutritionOverride: value });
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setOrderIds((prev) => {
            const oldIndex = prev.indexOf(String(active.id));
            const newIndex = prev.indexOf(String(over.id));
            if (oldIndex < 0 || newIndex < 0) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    const dismissToast = (mealId: string) => {
        setDeleteToasts((prev) => {
            const toast = prev.find((t) => t.mealId === mealId);
            if (toast) window.clearTimeout(toast.timeoutId);
            return prev.filter((t) => t.mealId !== mealId);
        });
    };

    const softDelete = (meal: MealRow) => {
        setEditingMealId((prev) => (prev === meal.id ? null : prev));
        setDeletedIds((prev) => new Set(prev).add(meal.id));
        dismissToast(meal.id);
        const timeoutId = window.setTimeout(() => {
            setDeleteToasts((prev) => prev.filter((t) => t.mealId !== meal.id));
        }, 8000);
        setDeleteToasts((prev) => [...prev, { mealId: meal.id, title: meal.title || meal.id, timeoutId }]);
    };

    const undoDelete = (mealId: string) => {
        dismissToast(mealId);
        setDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(mealId);
            return next;
        });
    };

    const discardAll = () => {
        const nextOrder = meals
            .filter((m) => !pendingNewIds.has(m.id))
            .sort((a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id))
            .map((m) => m.id);
        setOrderIds(nextOrder);
        setMeals((prev) => prev.filter((m) => !pendingNewIds.has(m.id)));
        setPendingNewIds(new Set());
        setDrafts({});
        setDeletedIds(new Set());
        setDeleteToasts((prev) => {
            prev.forEach((t) => window.clearTimeout(t.timeoutId));
            return [];
        });
        setMessage('Discarded unsaved meal changes.');
    };

    const addMeal = () => {
        const id = `meal_${Date.now()}`;
        setMeals((prev) => {
            const nextOrder = prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.display_order), 0) + 1;
            return [
                ...prev,
                {
                    id,
                    title: 'New meal',
                    description: '',
                    image: '',
                    price: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    calories: 0,
                    is_active: true,
                    display_order: nextOrder,
                    ingredient_ids: []
                }
            ];
        });
        setPendingNewIds((p) => new Set(p).add(id));
        setEditingMealId(id);
        setStatusFilter('all');
        setMealQuery('');
        window.requestAnimationFrame(() => {
            newRowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };

    const saveDirtyMeals = async () => {
        if (totalDirty === 0) return;
        setSavingMeals(true);
        setMessage(null);

        const visibleOrder = orderIds.filter((id) => !deletedIds.has(id));
        const upsertRows = visibleOrder
            .map((id, index) => {
                const meal = mealsById.get(id);
                if (!meal) return null;
                const draft = getDraft(meal);
                const row = {
                    id: meal.id,
                    title: draft.title,
                    description: draft.description,
                    image: draft.image,
                    price: draft.price,
                    protein: draft.nutritionOverride ? draft.protein : meal.protein,
                    carbs: draft.nutritionOverride ? draft.carbs : meal.carbs,
                    fat: draft.nutritionOverride ? draft.fat : meal.fat,
                    calories: draft.nutritionOverride ? draft.calories : meal.calories,
                    is_active: draft.is_active,
                    display_order: index + 1
                };
                const dirty = dirtyMealIds.has(id);
                return dirty ? row : null;
            })
            .filter(Boolean);

        const deleted = Array.from(deletedIds);
        const upsertRes = upsertRows.length > 0
            ? await supabase.from('meal_items').upsert(upsertRows, { onConflict: 'id' })
            : { error: null };
        const deleteRes = deleted.length > 0
            ? await supabase.from('meal_items').delete().in('id', deleted)
            : { error: null };

        setSavingMeals(false);

        if (upsertRes.error || deleteRes.error) {
            setMessage('Failed to save meals. Please retry.');
            return;
        }

        await refreshMenu();
        await reloadMeals();
        setDrafts({});
        setDeletedIds(new Set());
        setPendingNewIds(new Set());
        setDeleteToasts((prev) => {
            prev.forEach((t) => window.clearTimeout(t.timeoutId));
            return [];
        });
        setMessage(`Saved ${totalDirty} meal change${totalDirty === 1 ? '' : 's'}.`);
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!savingMeals) {
                    void saveDirtyMeals();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [savingMeals, totalDirty, meals, drafts, deletedIds, orderIds]);

    const mealStats = useMemo(() => {
        const visibleMeals = orderedMeals.filter((m) => !deletedIds.has(m.id));
        return {
            total: visibleMeals.length,
            active: visibleMeals.filter((m) => getDraft(m).is_active).length
        };
    }, [orderedMeals, deletedIds, getDraft]);

    const saveShortcutLabel = useMemo(
        () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘S' : 'Ctrl+S'),
        []
    );

    const editingMeal = editingMealId ? mealsById.get(editingMealId) : undefined;

    return (
        <section className="admin-section admin-section--flush admin-meals-manager">
            <div className="admin-section-head admin-section-head--row admin-meals-hero">
                <div>
                    <h2 className="admin-meals-title">Meals</h2>
                    <p className="admin-help admin-meals-help">
                        <strong>Live</strong> meals appear on the home page under &ldquo;Signature meals.&rdquo; <strong>Draft</strong> meals are saved to the database but hidden from customers &mdash; only you can see them here. New meals start as <strong>Live</strong>; switch to Draft before saving if you&apos;re not ready to publish. <strong>Nutrition Data</strong> (customizer add-ons) lives on the Nutrition Data tab.
                    </p>
                </div>
                <div className="admin-stat-badges admin-meals-badges">
                    <span className="admin-stat-pill">{mealStats.total} total</span>
                    <span className="admin-stat-pill admin-stat-pill--live">{mealStats.active} live</span>
                </div>
            </div>
            <div className="admin-toolbar admin-toolbar--meals admin-meals-toolbar">
                <input
                    className="admin-input admin-meals-input"
                    value={mealQuery}
                    onChange={(e) => setMealQuery(e.target.value)}
                    placeholder="Search meals"
                    aria-label="Search meals"
                />
                <select
                    className="admin-input admin-meals-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'live' | 'draft')}
                    aria-label="Filter by status"
                >
                    <option value="all">All</option>
                    <option value="live">Live</option>
                    <option value="draft">Draft</option>
                </select>
                <button type="button" className="admin-btn admin-meals-add" onClick={addMeal}>
                    + Add meal
                </button>
            </div>
            {!dndEnabled && (statusFilter !== 'all' || mealQuery.trim() !== '') && (
                <p className="admin-meals-dnd-hint">Clear search and set filter to &quot;All&quot; to drag and reorder.</p>
            )}
            {filteredMeals.length === 0 && (
                <p className="admin-empty admin-meals-empty">
                    {orderedMeals.length === 0
                        ? 'No meals yet. Use + Add meal to create one—nutrition can match your recipe or be edited here.'
                        : 'No matches. Try another search or status filter.'}
                </p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={filteredMeals.map((m) => m.id)} strategy={verticalListSortingStrategy} disabled={!dndEnabled}>
                    <ul className="admin-collapsed-meal-list">
                        {filteredMeals.map((meal) => {
                            const draft = getDraft(meal);
                            const dirty = dirtyMealIds.has(meal.id);
                            const macros = {
                                protein: draft.nutritionOverride ? draft.protein : meal.protein,
                                carbs: draft.nutritionOverride ? draft.carbs : meal.carbs,
                                fat: draft.nutritionOverride ? draft.fat : meal.fat,
                                calories: draft.nutritionOverride ? draft.calories : meal.calories
                            };

                            return (
                                <li
                                    key={meal.id}
                                    ref={(el) => {
                                        newRowRefs.current[meal.id] = el;
                                    }}
                                >
                                    <SortableMealRow id={meal.id} disabled={!dndEnabled}>
                                        {({ setNodeRef, style, dragAttributes, dragListeners }) => (
                                            <article ref={setNodeRef} style={style} className="admin-collapsed-item">
                                                <div
                                                    className="admin-collapsed-row"
                                                    onClick={() => openMealEditor(meal.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            openMealEditor(meal.id);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <button
                                                        type="button"
                                                        className="admin-drag-handle"
                                                        onClick={(e) => e.stopPropagation()}
                                                        {...dragAttributes}
                                                        {...dragListeners}
                                                        aria-label="Drag to reorder"
                                                        disabled={!dndEnabled}
                                                    >
                                                        <DragHandleIcon />
                                                    </button>
                                                    <img className="admin-row-thumb" src={draft.image || meal.image} alt="" />
                                                    <div className="admin-row-main">
                                                        <div className="admin-row-title-line">
                                                            <span className="admin-row-title">{draft.title || 'Untitled meal'}</span>
                                                            {dirty && <span className="admin-row-unsaved"><span className="admin-row-dot" />Unsaved</span>}
                                                        </div>
                                                        <p className="admin-row-subtitle">
                                                            {formatPrice(draft.price)} <span className="admin-row-sep" aria-hidden>·</span> {macros.calories} cal <span className="admin-row-sep" aria-hidden>·</span> {macros.protein}P / {macros.carbs}C / {macros.fat}F
                                                        </p>
                                                    </div>
                                                    <span className={`admin-row-status ${draft.is_active ? 'live' : 'draft'}`}>
                                                        {draft.is_active ? 'Live' : 'Draft'}
                                                    </span>
                                                    <span className="admin-row-chevron" aria-hidden>▸</span>
                                                </div>
                                            </article>
                                        )}
                                    </SortableMealRow>
                                </li>
                            );
                        })}
                    </ul>
                </SortableContext>
            </DndContext>
            {deleteToasts.length > 0 && (
                <div className="admin-delete-toast-stack">
                    {deleteToasts.map((toast) => (
                        <div key={toast.mealId} className="admin-delete-toast">
                            <span>{toast.title} deleted</span>
                            <button type="button" onClick={() => undoDelete(toast.mealId)}>Undo</button>
                        </div>
                    ))}
                </div>
            )}
            {totalDirty > 0 && (
                <div className="admin-sticky-savebar admin-meals-savebar">
                    <div className="admin-meals-savebar-text">
                        <span className="admin-meals-savebar-count">
                            {totalDirty} meal{totalDirty === 1 ? '' : 's'} with unsaved changes
                        </span>
                        <span className="admin-meals-savebar-kbd">{saveShortcutLabel} to save</span>
                    </div>
                    <div className="admin-sticky-actions">
                        <button type="button" className="admin-btn secondary admin-meals-btn-discard" onClick={discardAll}>
                            Discard
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-meals-btn-save"
                            onClick={() => void saveDirtyMeals()}
                            disabled={savingMeals || loading}
                        >
                            {savingMeals ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </div>
            )}
            <AdminModal
                open={Boolean(editingMeal)}
                onClose={closeMealEditor}
                title={editingMeal ? (getDraft(editingMeal).title.trim() || 'New meal') : 'Meal'}
                subtitle="Tap outside, Close, or Esc to return to the list. Unsaved edits stay in memory until you save."
                className="admin-meals-manager"
                footer={totalDirty > 0 ? (
                    <div className="admin-modal-save-footer">
                        <span className="admin-modal-save-count">
                            {totalDirty} unsaved change{totalDirty === 1 ? '' : 's'}
                        </span>
                        <div className="admin-modal-save-actions">
                            <button type="button" className="admin-btn secondary admin-meals-btn-discard" onClick={discardAll}>
                                Discard
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-meals-btn-save"
                                onClick={() => void saveDirtyMeals()}
                                disabled={savingMeals || loading}
                            >
                                {savingMeals ? 'Saving…' : 'Save all'}
                            </button>
                        </div>
                    </div>
                ) : undefined}
            >
                {editingMeal && (
                    <MealEditorForm
                        meal={editingMeal}
                        draft={getDraft(editingMeal)}
                        updateDraft={(patch) => updateDraft(editingMeal, patch)}
                        setNutritionOverride={(v) => setNutritionOverride(editingMeal, v)}
                        onDelete={() => softDelete(editingMeal)}
                        supabase={supabase}
                    />
                )}
            </AdminModal>
        </section>
    );
}
