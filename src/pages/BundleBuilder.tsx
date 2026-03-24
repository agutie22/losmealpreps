import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import { PROTEINS, CARBS, VEGGIES, SAUCES, type Macronutrients, type Ingredient } from '../data/ingredients';
import './BundleBuilder.css';

interface BundleMealCombination {
    id: string;
    protein: Ingredient;
    carb: Ingredient;
    veggie: Ingredient;
    quantity: number;
}

const TARGET_COUNT = 10;
const STANDARD_PROTEIN_IDS = ['p2', 'p3', 'p5', 'p_tilapia'];
const PREMIUM_PROTEIN_IDS = ['p1', 'p4', 'p_ribeye', 'p_shrimp', 'p_salmon', 'p_bulgogi'];

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
    const [bundleSauces, setBundleSauces] = useState<Array<{ sauceId: string, size: 'standard' | 'large', quantity: number }>>([]);
    const [selectedExtraSauceId, setSelectedExtraSauceId] = useState<string>(SAUCES[1].id); // Default to Chimichurri
    const [extraSaucePortionSize, setExtraSaucePortionSize] = useState<'standard' | 'large'>('standard');

    const selectedExtraSauce = useMemo(() => SAUCES.find(s => s.id === selectedExtraSauceId), [selectedExtraSauceId]);
    const currentExtraSaucePrice = selectedExtraSauce
        ? (extraSaucePortionSize === 'large' ? selectedExtraSauce.priceLarge : selectedExtraSauce.price)
        : 0;

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

    const handleAddExtraSauce = () => {
        setBundleSauces(prev => {
            const existing = prev.find(s => s.sauceId === selectedExtraSauceId && s.size === extraSaucePortionSize);
            if (existing) {
                return prev.map(s =>
                    (s.sauceId === selectedExtraSauceId && s.size === extraSaucePortionSize)
                        ? { ...s, quantity: s.quantity + 1 }
                        : s
                );
            }
            return [...prev, { sauceId: selectedExtraSauceId, size: extraSaucePortionSize, quantity: 1 }];
        });
    };

    const handleRemoveExtraSauce = (sauceId: string, size: 'standard' | 'large') => {
        setBundleSauces(prev => prev.filter(s => !(s.sauceId === sauceId && s.size === size)));
    };

    const calculateTotalPrice = () => {
        let total = price;
        bundleSauces.forEach(bs => {
            const sauce = SAUCES.find(s => s.id === bs.sauceId);
            if (sauce) {
                total += (bs.size === 'standard' ? sauce.price : sauce.priceLarge) * bs.quantity;
            }
        });
        return total;
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

        // Add Sauce Macros and Description
        bundleSauces.forEach(bs => {
            const sauce = SAUCES.find(s => s.id === bs.sauceId);
            if (sauce) {
                const sauceSizeText = bs.size === 'large' ? '8oz' : '2oz';
                descriptionParts.push(`${bs.quantity}x Extra Sauce: ${sauce.name} (${sauceSizeText})`);

                const sauceMacros = bs.size === 'standard' ? sauce.macros : sauce.macrosLarge;
                totalMacros.protein += sauceMacros.protein * bs.quantity;
                totalMacros.carbs += sauceMacros.carbs * bs.quantity;
                totalMacros.fat += sauceMacros.fat * bs.quantity;
                totalMacros.calories += sauceMacros.calories * bs.quantity;
            }
        });

        const description = `${TARGET_COUNT} Meals (6oz):\n${descriptionParts.join('\n')}`;

        addToCart({
            id: `bundle-${variant}-${Date.now()}`,
            title: title,
            description: description,
            image: image,
            price: calculateTotalPrice(),
            subscriberPrice: calculateTotalPrice(), // Bundles are already a deal
            tags: ['Bundle Deal', isPremium ? 'Premium' : 'Standard'],
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

                {totalSelected === TARGET_COUNT && (
                    <div className="extra-sauces-section" style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                        <h3>Add Extra Sauces</h3>
                        <p className="step-description">Enhance your bundle with optional side sauces.</p>

                        <div className="combo-selectors" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="selector-group">
                                <label>Sauce Type</label>
                                <select
                                    value={selectedExtraSauceId}
                                    onChange={(e) => setSelectedExtraSauceId(e.target.value)}
                                    className="bundle-select"
                                >
                                    {SAUCES.filter(s => s.id !== 's0').map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} (+${(extraSaucePortionSize === 'large' ? s.priceLarge : s.price).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="selector-group">
                                <label>Size</label>
                                <select
                                    value={extraSaucePortionSize}
                                    onChange={(e) => setExtraSaucePortionSize(e.target.value as 'standard' | 'large')}
                                    className="bundle-select"
                                >
                                    <option value="standard">2oz</option>
                                    <option value="large">8oz</option>
                                </select>
                            </div>
                        </div>

                        <div className="combo-add-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <Button variant="secondary" onClick={handleAddExtraSauce}>
                                Add {selectedExtraSauce?.name} (+${currentExtraSaucePrice.toFixed(2)})
                            </Button>
                        </div>

                        {bundleSauces.length > 0 && (
                            <div className="added-meals-list" style={{ marginTop: '1.5rem' }}>
                                {bundleSauces.map((bs, index) => {
                                    const sauce = SAUCES.find(s => s.id === bs.sauceId);
                                    return (
                                        <div key={`${bs.sauceId}-${bs.size}-${index}`} className="added-meal-item">
                                            <div className="added-meal-qty">{bs.quantity}x</div>
                                            <div className="added-meal-details">
                                                <div className="added-meal-protein">{sauce?.name}</div>
                                                <div className="added-meal-sides">{bs.size === 'large' ? '8oz' : '2oz'}</div>
                                            </div>
                                            <button
                                                className="remove-meal-btn"
                                                onClick={() => handleRemoveExtraSauce(bs.sauceId, bs.size)}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="bundle-modal-footer">
                    <div className="bundle-total-price" style={{
                        textAlign: 'right',
                        marginBottom: '1rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)'
                    }}>
                        Total: ${calculateTotalPrice().toFixed(2)}
                    </div>
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
