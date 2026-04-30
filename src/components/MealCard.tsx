import type { Meal } from '../types/menu';
import Button from './Button';
import './MealCard.css';

const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23f0ebe3'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%23b08d6e' font-family='system-ui' font-size='15'%3EPhoto%3C/text%3E%3C/svg%3E";

interface MealCardProps {
    meal: Meal;
    onCustomize?: (meal: Meal) => void;
    onAdd?: (meal: Meal) => void;
    hideCustomize?: boolean;
}

export default function MealCard({ meal, onCustomize, onAdd, hideCustomize = false }: MealCardProps) {
    const src = meal.image?.trim() ? meal.image : PLACEHOLDER;
    const price = Number.isFinite(Number(meal.price)) ? Number(meal.price) : 0;

    return (
        <article className="meal-card">
            <div className="meal-card-img-wrap">
                <img src={src} alt={meal.title} className="meal-card-img" loading="lazy" />
            </div>
            <div className="meal-card-body">
                <h3 className="meal-card-title">{meal.title}</h3>
                {meal.description && (
                    <p className="meal-card-desc">{meal.description}</p>
                )}
                <div className="meal-card-macros">
                    <span className="meal-macro-pill meal-macro-pill--p">{meal.macros.protein}g P</span>
                    <span className="meal-macro-pill meal-macro-pill--c">{meal.macros.carbs}g C</span>
                    <span className="meal-macro-pill meal-macro-pill--f">{meal.macros.fat}g F</span>
                    <span className="meal-macro-pill meal-macro-pill--cal">{meal.macros.calories} cal</span>
                </div>
                <div className="meal-card-footer">
                    <span className="meal-card-price">${price.toFixed(2)}</span>
                    <div className="meal-card-actions">
                        {!hideCustomize && (
                            <Button variant="outline" size="sm" onClick={() => onCustomize?.(meal)}>
                                Customize
                            </Button>
                        )}
                        <Button size="sm" onClick={() => onAdd?.(meal)}>Add</Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
