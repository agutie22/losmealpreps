import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
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
import AdminModal from '../../components/admin/AdminModal';
import type { IngredientRow } from './types';

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
    return (
        <label className="admin-field-label" htmlFor={htmlFor}>
            {children}
        </label>
    );
}

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

function formatPrice(value: number): string {
    return `$${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;
}

function SortableIngredientRow({
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

type IngredientsManagerProps = {
    ingredients: IngredientRow[];
    setIngredients: Dispatch<SetStateAction<IngredientRow[]>>;
    patchIngredient: (id: string, patch: Partial<IngredientRow>) => void;
    deleteIngredient: (id: string) => void;
    addIngredient: () => string;
    ingredientQuery: string;
    setIngredientQuery: (v: string) => void;
    ingredientCategoryFilter: 'all' | IngredientRow['category'];
    setIngredientCategoryFilter: (v: 'all' | IngredientRow['category']) => void;
};

export default function IngredientsManager({
    ingredients,
    setIngredients,
    patchIngredient,
    deleteIngredient,
    addIngredient,
    ingredientQuery,
    setIngredientQuery,
    ingredientCategoryFilter,
    setIngredientCategoryFilter
}: IngredientsManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredIngredients = useMemo(
        () => ingredients.filter((item) => {
            const matchesCategory = ingredientCategoryFilter === 'all' || item.category === ingredientCategoryFilter;
            const query = ingredientQuery.toLowerCase();
            const matchesQuery = item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        }),
        [ingredients, ingredientCategoryFilter, ingredientQuery]
    );

    const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
    const editing = editingId ? byId.get(editingId) : undefined;

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const dndEnabled = ingredientCategoryFilter === 'all' && ingredientQuery.trim() === '';

    const onAdd = () => {
        const id = addIngredient();
        setEditingId(id);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setIngredients((prev) => {
            const oldIndex = prev.findIndex((i) => i.id === active.id);
            const newIndex = prev.findIndex((i) => i.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return prev;
            
            const next = arrayMove(prev, oldIndex, newIndex);
            return next.map((item, index) => ({
                ...item,
                display_order: index + 1
            }));
        });
    };

    return (
        <section className="admin-section admin-section--flush admin-ingredients-manager admin-panel-dark">
            <div className="admin-section-head admin-section-head--row admin-meals-hero">
                <div>
                    <h2 className="admin-meals-title">Nutrition Data</h2>
                    <p className="admin-help admin-meals-help">
                        Customizer add-ons (proteins, carbs, veggies, sauces). Open a row to edit all fields in one place.
                    </p>
                </div>
            </div>
            <div className="admin-toolbar admin-ingredients-toolbar">
                <input
                    className="admin-input admin-meals-input"
                    value={ingredientQuery}
                    onChange={(e) => setIngredientQuery(e.target.value)}
                    placeholder="Search by name or id"
                    aria-label="Search nutrition data"
                />
                <select
                    className="admin-input admin-meals-filter"
                    value={ingredientCategoryFilter}
                    onChange={(e) => setIngredientCategoryFilter(e.target.value as 'all' | IngredientRow['category'])}
                    aria-label="Filter by category"
                >
                    <option value="all">All categories</option>
                    <option value="protein">Protein</option>
                    <option value="carb">Carb</option>
                    <option value="veggie">Veggie</option>
                    <option value="sauce">Sauce</option>
                </select>
                <button type="button" className="admin-btn admin-meals-add" onClick={onAdd}>
                    + Add item
                </button>
            </div>
            {filteredIngredients.length === 0 && (
                <p className="admin-empty admin-meals-empty">
                    {ingredients.length === 0
                        ? 'No nutrition data yet. Add one to get started.'
                        : 'No matches. Try another search or filter.'}
                </p>
            )}
            {!dndEnabled && (ingredientCategoryFilter !== 'all' || ingredientQuery.trim() !== '') && (
                <p className="admin-meals-dnd-hint">Clear search and set filter to &quot;All categories&quot; to drag and reorder.</p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={filteredIngredients.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={!dndEnabled}>
                    <ul className="admin-collapsed-meal-list" style={{ marginTop: '1rem' }}>
                        {filteredIngredients.map((item) => (
                            <li key={item.id}>
                                <SortableIngredientRow id={item.id} disabled={!dndEnabled}>
                                    {({ setNodeRef, style, dragAttributes, dragListeners }) => (
                                        <article ref={setNodeRef} style={style} className="admin-collapsed-item">
                                            <div
                                                className="admin-collapsed-row admin-collapsed-row--ingredient"
                                                onClick={() => setEditingId(item.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setEditingId(item.id);
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
                                                <div className="admin-row-main">
                                                    <div className="admin-row-title-line">
                                                        <span className="admin-row-title">{item.name || 'Unnamed'}</span>
                                                        {item.is_premium && <span className="admin-badge admin-badge--premium" style={{ marginLeft: '0.5rem' }}>Premium</span>}
                                                    </div>
                                                    <p className="admin-row-subtitle">
                                                        <span className={`admin-cat-pill admin-cat-pill--${item.category}`} style={{ marginRight: '0.5rem' }}>{item.category}</span>
                                                        {formatPrice(item.price)} <span className="admin-row-sep" aria-hidden>·</span> {item.calories} cal <span className="admin-row-sep" aria-hidden>·</span> {item.protein}P / {item.carbs}C / {item.fat}F
                                                    </p>
                                                </div>
                                                <span className={`admin-row-status ${item.is_active ? 'live' : 'draft'}`}>
                                                    {item.is_active ? 'Live' : 'Draft'}
                                                </span>
                                                <span className="admin-row-chevron" aria-hidden>▸</span>
                                            </div>
                                        </article>
                                    )}
                                </SortableIngredientRow>
                            </li>
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            <AdminModal
                open={Boolean(editing)}
                onClose={() => setEditingId(null)}
                title={editing ? (editing.name || 'Nutrition Data') : 'Nutrition Data'}
                subtitle="All fields for this add-on. Save from the header when you are done."
                className="admin-meals-manager"
            >
                {editing && (
                    <div className="admin-ingredient-modal-form admin-expanded-form" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-form-grid admin-form-grid--ingredient">
                            <div className="admin-field">
                                <FieldLabel>Id</FieldLabel>
                                <input
                                    className="admin-input admin-meals-input mono"
                                    value={editing.id}
                                    onChange={(e) => {
                                        const nextId = e.target.value;
                                        setIngredients((prev) => {
                                            const i = prev.findIndex((m) => m.id === editing.id);
                                            if (i < 0) return prev;
                                            const copy = [...prev];
                                            copy[i] = { ...copy[i], id: nextId };
                                            return copy;
                                        });
                                        setEditingId(nextId);
                                    }}
                                />
                            </div>
                            <div className="admin-field">
                                <FieldLabel>Name</FieldLabel>
                                <input
                                    className="admin-input admin-meals-input"
                                    value={editing.name}
                                    onChange={(e) => patchIngredient(editing.id, { name: e.target.value })}
                                />
                            </div>
                            <div className="admin-field">
                                <FieldLabel>Category</FieldLabel>
                                <select
                                    className="admin-input admin-meals-input"
                                    value={editing.category}
                                    onChange={(e) => patchIngredient(editing.id, { category: e.target.value as IngredientRow['category'] })}
                                >
                                    <option value="protein">Protein</option>
                                    <option value="carb">Carb</option>
                                    <option value="veggie">Veggie</option>
                                    <option value="sauce">Sauce</option>
                                </select>
                            </div>
                            <div className="admin-field">
                                <FieldLabel>Sort order</FieldLabel>
                                <input
                                    className="admin-input admin-meals-input"
                                    type="number"
                                    value={editing.display_order}
                                    onChange={(e) => patchIngredient(editing.id, { display_order: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <label className="admin-toggle-row">
                            <input
                                type="checkbox"
                                checked={editing.is_active}
                                onChange={(e) => patchIngredient(editing.id, { is_active: e.target.checked })}
                            />
                            <span>Visible in customizer</span>
                        </label>
                        <label className="admin-toggle-row">
                            <input
                                type="checkbox"
                                checked={editing.is_premium}
                                onChange={(e) => patchIngredient(editing.id, { is_premium: e.target.checked })}
                            />
                            <span>Premium</span>
                        </label>
                        <div className="admin-subpanel">
                            <h4 className="admin-subpanel-title">Pricing</h4>
                            <div className="admin-form-grid admin-form-grid--ing-pricing">
                                <div className="admin-field">
                                    <FieldLabel>Standard add-on ($)</FieldLabel>
                                    <input
                                        className="admin-input admin-meals-input"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={editing.price}
                                        onChange={(e) => patchIngredient(editing.id, { price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="admin-field">
                                    <FieldLabel>Large add-on ($)</FieldLabel>
                                    <input
                                        className="admin-input admin-meals-input"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={editing.price_large ?? 0}
                                        onChange={(e) => patchIngredient(editing.id, { price_large: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="admin-nutri-grid">
                            <div className="admin-subpanel">
                                <h4 className="admin-subpanel-title">Standard portion</h4>
                                <div className="admin-macro-inputs admin-macro-inputs--compact">
                                    <div className="admin-field admin-macro-field admin-macro-field--p">
                                        <FieldLabel>Protein (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.protein}
                                            onChange={(e) => patchIngredient(editing.id, { protein: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--c">
                                        <FieldLabel>Carbs (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.carbs}
                                            onChange={(e) => patchIngredient(editing.id, { carbs: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--f">
                                        <FieldLabel>Fat (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.fat}
                                            onChange={(e) => patchIngredient(editing.id, { fat: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--k">
                                        <FieldLabel>Calories</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.calories}
                                            onChange={(e) => patchIngredient(editing.id, { calories: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="admin-subpanel">
                                <h4 className="admin-subpanel-title">Large portion</h4>
                                <div className="admin-macro-inputs admin-macro-inputs--compact">
                                    <div className="admin-field admin-macro-field admin-macro-field--p">
                                        <FieldLabel>Protein (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.protein_large ?? 0}
                                            onChange={(e) => patchIngredient(editing.id, { protein_large: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--c">
                                        <FieldLabel>Carbs (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.carbs_large ?? 0}
                                            onChange={(e) => patchIngredient(editing.id, { carbs_large: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--f">
                                        <FieldLabel>Fat (g)</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.fat_large ?? 0}
                                            onChange={(e) => patchIngredient(editing.id, { fat_large: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="admin-field admin-macro-field admin-macro-field--k">
                                        <FieldLabel>Calories</FieldLabel>
                                        <input
                                            className="admin-input admin-meals-input"
                                            type="number"
                                            min={0}
                                            value={editing.calories_large ?? 0}
                                            onChange={(e) => patchIngredient(editing.id, { calories_large: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-danger-zone">
                            <button
                                type="button"
                                className="admin-delete-link"
                                onClick={() => {
                                    deleteIngredient(editing.id);
                                    setEditingId(null);
                                }}
                            >
                                Remove item
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>
        </section>
    );
}
