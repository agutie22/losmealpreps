import React, { useState, useMemo } from 'react';
import { meals } from '../data/meals';
import MealCard from '../components/MealCard';
import SubscriptionToggle from '../components/SubscriptionToggle';
import MealFilters from '../components/MealFilters';
import { useCart } from '../context/CartContext';
import './Meals.css';

const Meals: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('All Meals');
    const { addToCart } = useCart();

    const filteredMeals = useMemo(() => {
        if (activeFilter === 'All Meals') return meals;
        return meals.filter(meal => meal.tags.includes(activeFilter));
    }, [activeFilter]);

    return (
        <div className="page meals-page">
            <header className="meals-header-section">
                <div className="container">
                    <span className="section-eyebrow">Chef-Prepared Meals</span>
                    <h1>Fuel Your Week. <br />No Cooking Required.</h1>
                    <p className="section-subtitle">
                        Select from our weekly menu of high-protein, macro-balanced meals. 
                        Fully customizable and delivered fresh to your door.
                    </p>
                    
                    <SubscriptionToggle />
                </div>
            </header>

            <MealFilters 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
            />

            <main className="container meals-grid-container">
                <div className="meals-grid">
                    {filteredMeals.map(meal => (
                        <MealCard 
                            key={meal.id} 
                            meal={meal} 
                            onAdd={() => addToCart(meal)}
                        />
                    ))}
                </div>
                
                {filteredMeals.length === 0 && (
                    <div className="no-results">
                        <p>No meals found for this selection. Try another filter!</p>
                    </div>
                )}
            </main>

            <section className="meals-info-section">
                <div className="container">
                    <div className="info-grid">
                        <div className="info-card">
                            <div className="info-icon">🚚</div>
                            <h3>Fresh Delivery</h3>
                            <p>Meals are prepared fresh and delivered in insulated boxes to maintain temperature.</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">🥗</div>
                            <h3>Clean Ingredients</h3>
                            <p>We use premium proteins, complex carbs, and fresh vegetables. No preservatives.</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">🔄</div>
                            <h3>Cancel Anytime</h3>
                            <p>Our weekly subscription is flexible. Pause, skip, or cancel with just one click.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Meals;
