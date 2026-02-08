import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';
import { PROTEINS, CARBS, VEGGIES, type ProteinOption, type Ingredient } from '../data/ingredients';
import '../pages/Customize.css'; // Utilizing existing styles

const MealBuilder = () => {
    const { addToCart } = useCart();

    // Meal Builder State
    const [selectedProtein, setSelectedProtein] = useState<ProteinOption>(PROTEINS[0]);
    const [selectedCarb, setSelectedCarb] = useState<Ingredient>(CARBS[0]);
    const [selectedVeggie, setSelectedVeggie] = useState<Ingredient>(VEGGIES[0]);
    const [builderPortionSize, setBuilderPortionSize] = useState<'standard' | 'large'>('standard');

    const calculateMealPrice = () => {
        let price = builderPortionSize === 'standard' ? selectedProtein.price : selectedProtein.priceLarge;
        price += selectedCarb.price;
        price += selectedVeggie.price;
        return price;
    };

    const handleAddToPlan = () => {
        const mealPrice = calculateMealPrice();
        const mealTitle = `Custom: ${selectedProtein.name}`;
        const mealDesc = `${builderPortionSize === 'large' ? 'Large (8oz)' : 'Standard (6oz)'} | ${selectedCarb.name} | ${selectedVeggie.name}`;

        // Calculate Macros
        const proteinMacros = builderPortionSize === 'large' ? selectedProtein.macrosLarge : selectedProtein.macros;

        const proteinAmount = proteinMacros.protein + selectedCarb.macros.protein + selectedVeggie.macros.protein;
        const carbAmount = proteinMacros.carbs + selectedCarb.macros.carbs + selectedVeggie.macros.carbs;
        const fatAmount = proteinMacros.fat + selectedCarb.macros.fat + selectedVeggie.macros.fat;
        const calorieAmount = proteinMacros.calories + selectedCarb.macros.calories + selectedVeggie.macros.calories;

        addToCart({
            id: `custom-${Date.now()}`,
            title: mealTitle,
            description: mealDesc,
            image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Custom+Meal',
            price: mealPrice,
            macros: {
                protein: proteinAmount,
                carbs: carbAmount,
                fat: fatAmount,
                calories: calorieAmount
            }
        });
    };

    return (
        <section className="meal-builder-section">
            <header className="customize-header">
                <h1>Build Your Meal</h1>
                <p>Select your protein, carbs, and veggies to create your perfect meal.</p>
            </header>

            <div className="builder-container">
                <div className="builder-controls">
                    {/* 1. Protein */}
                    <div className="builder-step">

                        <h3>1. Choose Protein</h3>

                        {/* Premium Section */}
                        <div className="premium-section-header">PREMIUM PROTEINS (6oz/8oz)</div>
                        <div className="ingredient-grid premium-grid">
                            {PROTEINS.filter(p => p.isPremium).map(protein => (
                                <button
                                    key={protein.id}
                                    className={`ingredient-btn premium ${selectedProtein.id === protein.id ? 'active' : ''}`}
                                    onClick={() => setSelectedProtein(protein)}
                                >
                                    <div className="ing-name">{protein.name}</div>
                                    <div className="ing-price">
                                        ${protein.price} / ${protein.priceLarge}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Regular Section */}
                        <div className="regular-section-header" style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>Standard Proteins</div>
                        <div className="ingredient-grid">
                            {PROTEINS.filter(p => !p.isPremium).map(protein => (
                                <button
                                    key={protein.id}
                                    className={`ingredient-btn ${selectedProtein.id === protein.id ? 'active' : ''}`}
                                    onClick={() => setSelectedProtein(protein)}
                                >
                                    <div className="ing-name">{protein.name}</div>
                                    <div className="ing-price">
                                        ${protein.price} / ${protein.priceLarge}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="portion-toggle-builder">
                            <label>Portion Size:</label>
                            <div className="toggle-group">
                                <button
                                    className={builderPortionSize === 'standard' ? 'active' : ''}
                                    onClick={() => setBuilderPortionSize('standard')}
                                >
                                    Standard (6oz)
                                </button>
                                <button
                                    className={builderPortionSize === 'large' ? 'active' : ''}
                                    onClick={() => setBuilderPortionSize('large')}
                                >
                                    Large (8oz)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. Carbs */}
                    <div className="builder-step">
                        <h3>2. Choose Carbs</h3>
                        <div className="ingredient-grid">
                            {CARBS.map(carb => (
                                <button
                                    key={carb.id}
                                    className={`ingredient-btn ${selectedCarb.id === carb.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCarb(carb)}
                                >
                                    <div className="ing-name">{carb.name}</div>
                                    {carb.price > 0 && <div className="ing-price">+${carb.price}</div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Veggies */}
                    <div className="builder-step">
                        <h3>3. Choose Veggies <span className="price-tag">+$1.00</span></h3>
                        <div className="ingredient-grid">
                            {VEGGIES.map(veggie => (
                                <button
                                    key={veggie.id}
                                    className={`ingredient-btn ${selectedVeggie.id === veggie.id ? 'active' : ''}`}
                                    onClick={() => setSelectedVeggie(veggie)}
                                >
                                    <div className="ing-name">{veggie.name}</div>
                                    {veggie.price > 0 && <div className="ing-price">+${veggie.price}</div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="builder-summary">
                    <h3>Your Custom Meal</h3>
                    <div className="summary-details">
                        <p><strong>Protein:</strong> {selectedProtein.name} ({builderPortionSize === 'large' ? '8oz' : '6oz'})</p>
                        <p><strong>Carb:</strong> {selectedCarb.name}</p>
                        <p><strong>Veggie:</strong> {selectedVeggie.name}</p>
                    </div>
                    <div className="summary-total">
                        Total: <span>${calculateMealPrice().toFixed(2)}</span>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleAddToPlan}
                        style={{ width: '100%' }}
                    >
                        Add to Plan
                    </Button>

                    <div className="policies-text">
                        <h4>Policies</h4>
                        <ul>
                            <li>Minimum Order: $60 or 5 Meals</li>
                            <li>Non-refundable deposit required</li>
                            <li>Pickup: Sunday or Monday</li>
                            <li>Delivery: Rates vary by city (Free for 12+ meals)</li>
                            <li>Payment: Zelle, Apple Pay, Cash</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MealBuilder;
