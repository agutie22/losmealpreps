import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import Button from './Button';
import '../pages/Customize.css'; // Utilizing existing styles

const MealBuilder = () => {
    const { addToCart, openCart } = useCart();
    const { menu, loading } = useMenu();
    const topRef = useRef<HTMLDivElement>(null);
    const proteins = menu.proteins;
    const carbs = menu.carbs;
    const veggies = menu.veggies;
    const sauces = menu.sauces;

    // Meal Builder State

    const [searchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedProteinId, setSelectedProteinId] = useState<string | null>(null);
    const [selectedCarbId, setSelectedCarbId] = useState<string | null>(null);
    const [selectedVeggieId, setSelectedVeggieId] = useState<string | null>(null);
    const [selectedSauceId, setSelectedSauceId] = useState<string | null>(null);
    const [builderPortionSize, setBuilderPortionSize] = useState<'standard' | 'large'>('standard');
    const [saucePortionSize, setSaucePortionSize] = useState<'standard' | 'large'>('standard');
    const [isInitialized, setIsInitialized] = useState(false);

    const selectedProtein = useMemo(
        () => proteins.find((item) => item.id === selectedProteinId) ?? proteins[0],
        [proteins, selectedProteinId]
    );
    const selectedCarb = useMemo(
        () => carbs.find((item) => item.id === selectedCarbId) ?? carbs[0],
        [carbs, selectedCarbId]
    );
    const selectedVeggie = useMemo(
        () => veggies.find((item) => item.id === selectedVeggieId) ?? veggies[0],
        [veggies, selectedVeggieId]
    );
    const selectedSauce = useMemo(
        () => sauces.find((item) => item.id === selectedSauceId) ?? sauces[0],
        [sauces, selectedSauceId]
    );

    useEffect(() => {
        if (!isInitialized && proteins.length > 0) {
            const proteinName = searchParams.get('proteinName');
            let initialProteinId = proteins[0].id;
            
            if (proteinName) {
                const matched = proteins.find(p => p.name === proteinName);
                if (matched) {
                    initialProteinId = matched.id;
                    setCurrentStep(2);
                }
            }
            
            setSelectedProteinId(initialProteinId);
            setIsInitialized(true);
        }
    }, [proteins, searchParams, isInitialized]);
    useEffect(() => {
        if (!selectedCarbId && carbs[0]) setSelectedCarbId(carbs[0].id);
    }, [selectedCarbId, carbs]);
    useEffect(() => {
        if (!selectedVeggieId && veggies[0]) setSelectedVeggieId(veggies[0].id);
    }, [selectedVeggieId, veggies]);
    useEffect(() => {
        if (!selectedSauceId && sauces[0]) setSelectedSauceId(sauces[0].id);
    }, [selectedSauceId, sauces]);

    const totalSteps = 5;

    const scrollToTop = () => {
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
            scrollToTop();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            scrollToTop();
        }
    };

    const calculateMealPrice = () => {
        if (!selectedProtein || !selectedCarb || !selectedVeggie || !selectedSauce) {
            return 0;
        }
        let price = builderPortionSize === 'standard' ? selectedProtein.price : selectedProtein.priceLarge;
        price += selectedCarb.price;
        price += selectedVeggie.price;
        price += saucePortionSize === 'standard' ? selectedSauce.price : selectedSauce.priceLarge;
        return price;
    };

    const handleAddToPlan = () => {
        if (!selectedProtein || !selectedCarb || !selectedVeggie || !selectedSauce) {
            return;
        }
        const mealPrice = calculateMealPrice();
        const mealTitle = `Custom: ${selectedProtein.name}`;
        const sauceDesc = selectedSauce.id !== 's0' ? ` | Sauce: ${selectedSauce.name} (${saucePortionSize === 'large' ? '8oz' : '2oz'})` : '';
        const mealDesc = `${builderPortionSize === 'large' ? 'Large (8oz)' : 'Standard (6oz)'} | ${selectedCarb.name} | ${selectedVeggie.name}${sauceDesc}`;

        // Calculate Macros
        const proteinMacros = builderPortionSize === 'large' ? selectedProtein.macrosLarge : selectedProtein.macros;
        const sauceMacros = saucePortionSize === 'large' ? selectedSauce.macrosLarge : selectedSauce.macros;

        const proteinAmount = proteinMacros.protein + selectedCarb.macros.protein + selectedVeggie.macros.protein + sauceMacros.protein;
        const carbAmount = proteinMacros.carbs + selectedCarb.macros.carbs + selectedVeggie.macros.carbs + sauceMacros.carbs;
        const fatAmount = proteinMacros.fat + selectedCarb.macros.fat + selectedVeggie.macros.fat + sauceMacros.fat;
        const calorieAmount = proteinMacros.calories + selectedCarb.macros.calories + selectedVeggie.macros.calories + sauceMacros.calories;

        addToCart({
            id: `custom-${Date.now()}`,
            title: mealTitle,
            description: mealDesc,
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23F0997B'/%3E%3C/svg%3E",
            price: mealPrice,
            macros: {
                protein: proteinAmount,
                carbs: carbAmount,
                fat: fatAmount,
                calories: calorieAmount
            }
        });

        setCurrentStep(1);
        scrollToTop();
        openCart();
    };

    // Render Steps
    const renderProgressBar = () => {
        return (
            <div className="wizard-progress-container" ref={topRef}>
                <div className="wizard-steps">
                    <div className={`wizard-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'current' : ''}`}>
                        <div className="step-circle">1</div>
                        <span className="step-label">Protein</span>
                    </div>
                    <div className={`wizard-line ${currentStep >= 2 ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'current' : ''}`}>
                        <div className="step-circle">2</div>
                        <span className="step-label">Carbs</span>
                    </div>
                    <div className={`wizard-line ${currentStep >= 3 ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'current' : ''}`}>
                        <div className="step-circle">3</div>
                        <span className="step-label">Veggies</span>
                    </div>
                    <div className={`wizard-line ${currentStep >= 4 ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'current' : ''}`}>
                        <div className="step-circle">4</div>
                        <span className="step-label">Sauce</span>
                    </div>
                    <div className={`wizard-line ${currentStep >= 5 ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'current' : ''}`}>
                        <div className="step-circle">5</div>
                        <span className="step-label">Review</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep1_Protein = () => (
        <div className="wizard-content fade-in">
            <h3>Choose Your Protein</h3>
            <p className="step-description">Select from our premium or standard protein options.</p>

            <div className="portion-toggle-builder mb-2rem">
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

            {/* Premium Section */}
            <div className="premium-section-header">PREMIUM PROTEINS</div>
            <div className="ingredient-grid premium-grid">
                {proteins.filter(p => p.isPremium).map(protein => (
                    <button
                        key={protein.id}
                        className={`ingredient-btn premium ${selectedProtein?.id === protein.id ? 'active' : ''}`}
                        onClick={() => setSelectedProteinId(protein.id)}
                    >
                        <div className="ing-name">{protein.name}</div>
                        <div className="ing-price">
                            ${protein.price} / ${protein.priceLarge}
                        </div>
                    </button>
                ))}
            </div>

            {/* Regular Section */}
            <div className="regular-section-header" style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>STANDARD PROTEINS</div>
            <div className="ingredient-grid">
                {proteins.filter(p => !p.isPremium).map(protein => (
                    <button
                        key={protein.id}
                        className={`ingredient-btn ${selectedProtein?.id === protein.id ? 'active' : ''}`}
                        onClick={() => setSelectedProteinId(protein.id)}
                    >
                        <div className="ing-name">{protein.name}</div>
                        <div className="ing-price">
                            ${protein.price} / ${protein.priceLarge}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2_Carbs = () => (
        <div className="wizard-content fade-in">
            <h3>Choose Your Carb</h3>
            <p className="step-description">Pair your protein with a healthy carbohydrate source.</p>
            <div className="ingredient-grid">
                {carbs.map(carb => (
                    <button
                        key={carb.id}
                        className={`ingredient-btn ${selectedCarb?.id === carb.id ? 'active' : ''}`}
                        onClick={() => setSelectedCarbId(carb.id)}
                    >
                        <div className="ing-name">{carb.name}</div>
                        {carb.price > 0 && <div className="ing-price">+${carb.price}</div>}
                        <div className="ing-macros-mini">
                            {carb.macros.carbs}g Carbs
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3_Veggies = () => (
        <div className="wizard-content fade-in">
            <h3>Choose Your Veggies</h3>
            <p className="step-description">Add some greens to complete your meal.</p>
            <div className="ingredient-grid">
                {veggies.map(veggie => (
                    <button
                        key={veggie.id}
                        className={`ingredient-btn ${selectedVeggie?.id === veggie.id ? 'active' : ''}`}
                        onClick={() => setSelectedVeggieId(veggie.id)}
                    >
                        <div className="ing-name">{veggie.name}</div>
                        {veggie.price > 0 && <div className="ing-price">+${veggie.price}</div>}
                        <div className="ing-macros-mini">
                            {veggie.macros.carbs}g Carbs
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep4_Sauce = () => (
        <div className="wizard-content fade-in">
            <h3>Choose Your Sauce</h3>
            <p className="step-description">Optionally add a delicious sauce to your meal.</p>

            <div className="portion-toggle-builder mb-2rem">
                <label>Sauce Size:</label>
                <div className="toggle-group">
                    <button
                        className={saucePortionSize === 'standard' ? 'active' : ''}
                        onClick={() => setSaucePortionSize('standard')}
                    >
                        2oz
                    </button>
                    <button
                        className={saucePortionSize === 'large' ? 'active' : ''}
                        onClick={() => setSaucePortionSize('large')}
                    >
                        8oz
                    </button>
                </div>
            </div>

            <div className="ingredient-grid">
                {sauces.map(sauce => (
                    <button
                        key={sauce.id}
                        className={`ingredient-btn ${selectedSauce?.id === sauce.id ? 'active' : ''}`}
                        onClick={() => setSelectedSauceId(sauce.id)}
                    >
                        <div className="ing-name">{sauce.name}</div>
                        {(saucePortionSize === 'standard' ? sauce.price : sauce.priceLarge) > 0 && (
                            <div className="ing-price">
                                +${saucePortionSize === 'standard' ? sauce.price.toFixed(2) : sauce.priceLarge.toFixed(2)}
                            </div>
                        )}
                        {sauce.id !== 's0' && (
                            <div className="ing-macros-mini">
                                {saucePortionSize === 'standard' ? sauce.macros.calories : sauce.macrosLarge.calories} Cal
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep5_Review = () => {

        const proteinMacros = builderPortionSize === 'large' ? selectedProtein.macrosLarge : selectedProtein.macros;
        const sauceMacros = saucePortionSize === 'large' ? selectedSauce.macrosLarge : selectedSauce.macros;

        const totalProtein = proteinMacros.protein + selectedCarb.macros.protein + selectedVeggie.macros.protein + sauceMacros.protein;
        const totalCarbs = proteinMacros.carbs + selectedCarb.macros.carbs + selectedVeggie.macros.carbs + sauceMacros.carbs;
        const totalFat = proteinMacros.fat + selectedCarb.macros.fat + selectedVeggie.macros.fat + sauceMacros.fat;
        const totalCalories = proteinMacros.calories + selectedCarb.macros.calories + selectedVeggie.macros.calories + sauceMacros.calories;

        return (
            <div className="wizard-content fade-in">
                <h3>Review Your Meal</h3>
                <p className="step-description">Check your selections and add to your plan.</p>

                <div className="review-summary-card">
                    <div className="review-item">
                        <span className="review-label">Protein ({builderPortionSize})</span>
                        <div className="review-value">
                            <strong>{selectedProtein.name}</strong>
                        </div>
                        <button className="edit-step-btn" onClick={() => setCurrentStep(1)}>Edit</button>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Carb</span>
                        <div className="review-value">
                            <strong>{selectedCarb.name}</strong>
                        </div>
                        <button className="edit-step-btn" onClick={() => setCurrentStep(2)}>Edit</button>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Veggie</span>
                        <div className="review-value">
                            <strong>{selectedVeggie.name}</strong>
                        </div>
                        <button className="edit-step-btn" onClick={() => setCurrentStep(3)}>Edit</button>
                    </div>
                    <div className="review-item">
                        <span className="review-label">Sauce ({saucePortionSize === 'large' ? '8oz' : '2oz'})</span>
                        <div className="review-value">
                            <strong>{selectedSauce.name}</strong>
                        </div>
                        <button className="edit-step-btn" onClick={() => setCurrentStep(4)}>Edit</button>
                    </div>

                    <div className="review-macros">
                        <div className="macro-pill protein">
                            <span className="macro-val">{totalProtein}g</span>
                            <span className="macro-lbl">Protein</span>
                        </div>
                        <div className="macro-pill carbs">
                            <span className="macro-val">{totalCarbs}g</span>
                            <span className="macro-lbl">Carbs</span>
                        </div>
                        <div className="macro-pill fats">
                            <span className="macro-val">{totalFat}g</span>
                            <span className="macro-lbl">Fat</span>
                        </div>
                        <div className="macro-pill calories">
                            <span className="macro-val">{totalCalories}</span>
                            <span className="macro-lbl">Cal</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="meal-builder-section">
            {!selectedProtein || !selectedCarb || !selectedVeggie || !selectedSauce ? (
                <div className="builder-container">
                    <p className="step-description">Menu options are not available right now.</p>
                </div>
            ) : (
                <>
            <header className="customize-header">
                <h1>Customize Your {selectedProtein?.name ?? 'Meal'}</h1>
                <p>Follow the steps to create your perfect custom meal.</p>
                {loading && <p className="step-description">Loading live menu...</p>}

            </header>

            {renderProgressBar()}

            <div className="builder-container wizard-layout">
                {/* Main Content Area */}
                <div className="wizard-main">
                    {currentStep === 1 && renderStep1_Protein()}
                    {currentStep === 2 && renderStep2_Carbs()}
                    {currentStep === 3 && renderStep3_Veggies()}
                    {currentStep === 4 && renderStep4_Sauce()}
                    {currentStep === 5 && renderStep5_Review()}

                    {/* Navigation Buttons */}
                    <div className="wizard-navigation">
                        {currentStep > 1 && (
                            <button className="nav-btn prev" onClick={prevStep}>
                                &larr; Back
                            </button>
                        )}

                        {currentStep < totalSteps ? (
                            <button className="nav-btn next" onClick={nextStep}>
                                Next Step &rarr;
                            </button>
                        ) : (
                            <Button
                                size="lg"
                                onClick={handleAddToPlan}
                                className="add-plan-btn"
                            >
                                Add to Plan - ${calculateMealPrice().toFixed(2)}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sticky Summary Sidebar */}
                <div className="builder-summary sticky-sidebar">
                    <h3>Summary</h3>
                    <div className="summary-details">
                        <p><strong>Protein:</strong> <span className='limit-text'>{selectedProtein.name}</span></p>
                        <p><strong>Carb:</strong> {selectedCarb.name}</p>
                        <p><strong>Veggie:</strong> {selectedVeggie.name}</p>
                        <p><strong>Sauce:</strong> {selectedSauce.name}</p>
                    </div>
                    <div className="summary-total">
                        Total: <span>${calculateMealPrice().toFixed(2)}</span>
                    </div>

                    <div className="policies-text">
                        <h4>Policies</h4>
                        <ul>
                            <li>Minimum Order: $60 or 5 Meals</li>
                            <li>Non-refundable deposit</li>
                            <li>Pickup: Sun or Mon</li>
                            <li>Delivery varies by city</li>
                        </ul>
                    </div>
                </div>
            </div>
                </>
            )}
        </section>
    );
};

export default MealBuilder;
