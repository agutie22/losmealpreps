import React from 'react';
import './MealFilters.css';

interface MealFiltersProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const MealFilters: React.FC<MealFiltersProps> = ({ activeFilter, onFilterChange }) => {
    const filters = [
        'All Meals',
        'High Protein',
        'Low Carb',
        'Gluten Free',
        'Keto Friendly',
        'Breakfast',
        'Customer Favorite'
    ];

    return (
        <div className="meal-filters-container">
            <div className="filters-scroll">
                {filters.map(filter => (
                    <button
                        key={filter}
                        className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                        onClick={() => onFilterChange(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MealFilters;
