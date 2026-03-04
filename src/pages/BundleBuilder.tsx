import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import { PROTEINS, CARBS, VEGGIES, type Macronutrients, type Ingredient } from '../data/ingredients';
import './BundleBuilder.css';

interface BundleMealCombination {
    id: string;
    protein: Ingredient;
    carb: Ingredient;
    veggie: Ingredient;
    quantity: number;
}

const TARGET_COUNT = 10;
const STANDARD_PROTEIN_IDS = ['p2', 'p3', 'p5'];
const PREMIUM_PROTEIN_IDS = ['p_ribeye', 'p_shrimp', 'p_salmon'];

const BundleBuilder: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // Parse query params for bundle type
    const queryParams = new URLSearchParams(location.search);
    const variant = queryParams.get('type') === 'premium' ? 'premium' : 'standard';

    const isPremium = variant === 'premium';
    const price = isPremium ? 150 : 115;
    const title = isPremium ? 'PREMIUM BUNDLE DEAL' : '10 MEAL BUNDLE DEAL';
    const allowedProteinIds = isPremium ? PREMIUM_PROTEIN_IDS : STANDARD_PROTEIN_IDS;
    const image = isPremium
        ? 'https://placehold.co/600x600/3E2723/B08D55?text=Premium+Bundle'
        : 'https://placehold.co/600x600/B08D55/3E2723?text=10+Meal+Bundle';

    // Filter proteins based on variant
    const currentBundleProteins = useMemo(() => {
        return PROTEINS.filter(p => allowedProteinIds.includes(p.id));
    }, [allowedProteinIds]);

    const [bundleMeals, setBundleMeals] = useState<BundleMealCombination[]>([]);

    // Form state
    const [selectedProteinId, setSelectedProteinId] = useState<string>('');
    const [selectedCarbId, setSelectedCarbId] = useState<string>(CARBS[0].id);
    const [selectedVeggieId, setSelectedVeggieId] = useState<string>(VEGGIES[0].id);
    const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

    // Initial setup
    useEffect(() => {
        if (currentBundleProteins.length > 0 && !selectedProteinId) {
            setSelectedProteinId(currentBundleProteins[0].id);
        }
    }, [currentBundleProteins, selectedProteinId]);

    const totalSelected = useMemo(() => {
        return bundleMeals.reduce((sum, meal) => sum + meal.quantity, 0);
    }, [bundleMeals]);

    const handleAddCombination = () => {
        if (totalSelected + quantityToAdd > TARGET_COUNT) return;

        const protein = currentBundleProteins.find(p => p.id === selectedProteinId);
        const carb = CARBS.find(c => c.id === selectedCarbId);
        const veggie = VEGGIES.find(v => v.id === selectedVeggieId);

        if (!protein || !carb || !veggie) return;

        const newCombination: BundleMealCombination = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            protein,
            carb,
            veggie,
            quantity: quantityToAdd
        };

        setBundleMeals(prev => [...prev, newCombination]);

        // Reset qty
        const newTotal = totalSelected + quantityToAdd;
        const newRemaining = TARGET_COUNT - newTotal;
        setQuantityToAdd(Math.min(1, newRemaining));
    };

    const handleRemoveCombination = (id: string) => {
        setBundleMeals(prev => prev.filter(m => m.id !== id));
    };

    const handleAddToCart = () => {
        if (totalSelected !== TARGET_COUNT) return;

        const descriptionParts: string[] = [];
        const totalMacros: Macronutrients = { protein: 0, carbs: 0, fat: 0, calories: 0 };

        bundleMeals.forEach(meal => {
            descriptionParts.push(`${meal.quantity}x [${meal.protein.name}, ${meal.carb.name}, ${meal.veggie.name}]`);

            totalMacros.protein += (meal.protein.macros.protein + meal.carb.macros.protein + meal.veggie.macros.protein) * meal.quantity;
            totalMacros.carbs += (meal.protein.macros.carbs + meal.carb.macros.carbs + meal.veggie.macros.carbs) * meal.quantity;
            totalMacros.fat += (meal.protein.macros.fat + meal.carb.macros.fat + meal.veggie.macros.fat) * meal.quantity;
            totalMacros.calories += (meal.protein.macros.calories + meal.carb.macros.calories + meal.veggie.macros.calories) * meal.quantity;
        });

        const description = `10 Meals (6oz):\n${descriptionParts.join('\n')}`;

        addToCart({
            id: `bundle-${variant}-${Date.now()}`,
            title: title,
            description: description,
            image: image,
            price: price,
            macros: totalMacros
        });

        // Return to home or open cart (handled by CartContext opening drawer implicitly if designed that way)
        navigate('/');
    };

    const remaining = TARGET_COUNT - totalSelected;
    const progressPercent = (totalSelected / TARGET_COUNT) * 100;

    return (
        <div className="page-container bundle-page">
            <div className="bundle-page-content">
                <div className="bundle-modal-header">
                    <h2>Build Your {isPremium ? 'Premium ' : ''}Bundle</h2>
                    <p>Select your 10 meals from the options below. (${price})</p>
                </div>

                <div className="bundle-progress">
                    <span className="progress-text">
                        {totalSelected} / {TARGET_COUNT} Selected
                        {remaining > 0 ? ` (Pick ${remaining} more)` : ' (Ready!)'}
                    </span>
                    <div className="progress-bar-bg">
                        <div
                            className={`progress-bar-fill ${totalSelected === TARGET_COUNT ? 'complete' : ''}`}
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                {remaining > 0 && (
                    <div className="combo-builder-section">
                        <h3>Add a Meal Combo</h3>
                        <div className="combo-selectors">
                            <div className="selector-group">
                                <label>Protein (6oz)</label>
                                <select
                                    value={selectedProteinId}
                                    onChange={(e) => setSelectedProteinId(e.target.value)}
                                    className="bundle-select"
                                >
                                    {currentBundleProteins.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="selector-group">
                                <label>Carb</label>
                                <select
                                    value={selectedCarbId}
                                    onChange={(e) => setSelectedCarbId(e.target.value)}
                                    className="bundle-select"
                                >
                                    {CARBS.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="selector-group">
                                <label>Veggie</label>
                                <select
                                    value={selectedVeggieId}
                                    onChange={(e) => setSelectedVeggieId(e.target.value)}
                                    className="bundle-select"
                                >
                                    {VEGGIES.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="combo-add-actions">
                            <div className="quantity-controls">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                                    disabled={quantityToAdd <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    -
                                </button>
                                <span className="qty-value">{quantityToAdd}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantityToAdd(Math.min(remaining, quantityToAdd + 1))}
                                    disabled={quantityToAdd >= remaining}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleAddCombination}
                                disabled={quantityToAdd < 1 || quantityToAdd > remaining}
                            >
                                Add {quantityToAdd} To Bundle
                            </Button>
                        </div>
                    </div>
                )}

                <div className="added-meals-section">
                    <h3>Your Selections</h3>
                    {bundleMeals.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                            No meals added yet. Use the builder above to start adding!
                        </p>
                    ) : (
                        <div className="added-meals-list">
                            {bundleMeals.map((meal) => (
                                <div key={meal.id} className="added-meal-item">
                                    <div className="added-meal-qty">{meal.quantity}x</div>
                                    <div className="added-meal-details">
                                        <div className="added-meal-protein">{meal.protein.name}</div>
                                        <div className="added-meal-sides">{meal.carb.name} & {meal.veggie.name}</div>
                                    </div>
                                    <button
                                        className="remove-meal-btn"
                                        onClick={() => handleRemoveCombination(meal.id)}
                                        aria-label="Remove meal combo"
                                        title="Remove"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bundle-modal-footer">
                    <Button
                        variant="primary"
                        size="lg"
                        disabled={totalSelected !== TARGET_COUNT}
                        onClick={handleAddToCart}
                        style={{ width: '100%' }}
                    >
                        {totalSelected === TARGET_COUNT ? 'Confirm & Add to Cart' : `Select ${remaining} more meals`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BundleBuilder;
