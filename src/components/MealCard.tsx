import type { Meal } from '../types/menu';
import Card from './Card';
import Button from './Button';
import MacroTracker from './MacroTracker';
import './MealCard.css';

const MEAL_IMG_PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23e7e5e4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2378716c' font-family='system-ui' font-size='18'%3EPhoto%3C/text%3E%3C/svg%3E";

interface MealCardProps {
    meal: Meal;
    onCustomize?: (meal: Meal) => void;
    onAdd?: (meal: Meal) => void;
    hideCustomize?: boolean; // New prop to optionally hide customize button for fixed meals
}

export default function MealCard({ meal, onCustomize, onAdd, hideCustomize = false }: MealCardProps) {
    const imageSrc = meal.image?.trim() ? meal.image : MEAL_IMG_PLACEHOLDER;
    const displayPrice = Number.isFinite(Number(meal.price)) ? Number(meal.price) : 0;

    return (
        <Card className="meal-card">
            <div className="meal-image-container">
                <img src={imageSrc} alt={meal.title} className="meal-image" />
                <div className="meal-diet-badge">High Protein</div>
            </div>

            <div className="meal-content">
                <h3 className="meal-title">{meal.title}</h3>
                <p className="meal-description">{meal.description}</p>

                <div className="meal-macros">
                    <MacroTracker
                        protein={meal.macros.protein}
                        carbs={meal.macros.carbs}
                        fat={meal.macros.fat}
                    />
                </div>

                <div className="meal-footer">
                    <span className="meal-price">${displayPrice.toFixed(2)}</span>
                    <div className="meal-actions">
                        {!hideCustomize && (
                            <Button variant="outline" size="sm" onClick={() => onCustomize?.(meal)}>
                                Customize
                            </Button>
                        )}
                        <Button size="sm" onClick={() => onAdd?.(meal)}>
                            Add
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
