import type { Meal } from '../data/meals';
import MealCard from './MealCard';
import './Feed.css';

interface FeedProps {
    meals: Meal[];
    onAdd?: (meal: Meal) => void;
}

export default function Feed({ meals, onAdd }: FeedProps) {
    return (
        <div className="feed-grid">
            {meals.map((meal) => (
                <MealCard
                    key={meal.id}
                    meal={meal}
                    onAdd={onAdd}
                    hideCustomize={true} // Fixed meals are not customizable in the feed
                />
            ))}
        </div>
    );
}

