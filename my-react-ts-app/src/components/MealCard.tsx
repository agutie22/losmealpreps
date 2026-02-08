import type { Meal } from '../data/meals';
import Card from './Card';
import Button from './Button';
import MacroTracker from './MacroTracker';
import './MealCard.css';

interface MealCardProps {
    meal: Meal;
    onCustomize?: (meal: Meal) => void;
    onAdd?: (meal: Meal) => void;
    hideCustomize?: boolean; // New prop to optionally hide customize button for fixed meals
}

export default function MealCard({ meal, onCustomize, onAdd, hideCustomize = false }: MealCardProps) {
    return (
        <Card className="meal-card">
            <div className="meal-image-container">
                <img src={meal.image} alt={meal.title} className="meal-image" />
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
                    <span className="meal-price">${meal.price.toFixed(2)}</span>
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
