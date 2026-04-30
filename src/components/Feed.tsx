import type { Meal } from '../types/menu';
import MealCard from './MealCard';
import './Feed.css';

interface FeedProps {
    meals: Meal[];
    onAdd: (meal: Meal) => void;
    onCustomize?: (meal: Meal) => void;
}

export default function Feed({ meals, onAdd, onCustomize }: FeedProps) {
    return (
        <div className="feed-grid">
            {meals.map(meal => (
                <MealCard
                    key={meal.id}
                    meal={meal}
                    onAdd={() => onAdd(meal)}
                    onCustomize={onCustomize ? () => onCustomize(meal) : undefined}
                    hideCustomize={!onCustomize}
                />
            ))}
        </div>
    );
}
