import type { Meal } from '../data/meals';
import Card from './Card';
import Button from './Button';
import MacroTracker from './MacroTracker';
import './MealCard.css';

import { useUser } from '../context/UserContext';

interface MealCardProps {
    meal: Meal;
    onCustomize?: (meal: Meal) => void;
    onAdd?: (meal: Meal) => void;
    hideCustomize?: boolean; // New prop to optionally hide customize button for fixed meals
}

export default function MealCard({ meal, onCustomize, onAdd, hideCustomize = false }: MealCardProps) {
    const { isSubscriber } = useUser();
    const savings = meal.price - meal.subscriberPrice;
    const currentPrice = isSubscriber ? meal.subscriberPrice : meal.price;

    return (
        <Card className="meal-card">
            <div className="meal-image-container">
                <img src={meal.image} alt={meal.title} className="meal-image" />
                <div className="meal-badges">
                    <div className="meal-badge premium">Chef's Choice</div>
                    <div className="meal-badge nutrition">High Protein</div>
                </div>
            </div>

            <div className="meal-content">
                <div className="meal-header">
                    <h3 className="meal-title">{meal.title}</h3>
                    <div className="meal-price-stack">
                        <span className="meal-price current">${currentPrice.toFixed(2)}</span>
                        {isSubscriber && (
                            <span className="meal-price original">${meal.price.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <p className="meal-description">{meal.description}</p>

                <div className="meal-subscription-info">
                    <span className="save-tag">SAVE ${savings.toFixed(2)}</span>
                    <span className="save-text">on weekly subscription</span>
                </div>

                <div className="meal-macros">
                    <MacroTracker
                        protein={meal.macros.protein}
                        carbs={meal.macros.carbs}
                        fat={meal.macros.fat}
                    />
                </div>

                <div className="meal-footer">
                    <div className="meal-actions">
                        {!hideCustomize && (
                            <Button variant="outline" size="sm" onClick={() => onCustomize?.(meal)}>
                                Customize
                            </Button>
                        )}
                        <Button size="sm" onClick={() => onAdd?.(meal)} className="add-btn">
                            Add to Plan
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
