import { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';
import { PROTEINS, CARBS, VEGGIES, type ProteinOption, type Ingredient } from '../data/ingredients';
import '../pages/Customize.css'; // Utilizing existing styles

const MealBuilder = () => {
    const { addToCart } = useCart();
    const topRef = useRef<HTMLDivElement>(null);

    // Meal Builder State

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedProtein, setSelectedProtein] = useState<ProteinOption>(PROTEINS[0]);
    const [selectedCarb, setSelectedCarb] = useState<Ingredient>(CARBS[0]);
    const [selectedVeggie, setSelectedVeggie] = useState<Ingredient>(VEGGIES[0]);
    const [builderPortionSize, setBuilderPortionSize] = useState<'standard' | 'large'>('standard');

    const totalSteps = 4;

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

        // Reset or redirect logic could go here
        // For now, maybe just reset to step 1 for correct flow? 
        // Or keep user on review page with success message?
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
            <div className="regular-section-header" style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>STANDARD PROTEINS</div>
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
        </div>
    );

    const renderStep2_Carbs = () => (
        <div className="wizard-content fade-in">
            <h3>Choose Your Carb</h3>
            <p className="step-description">Pair your protein with a healthy carbohydrate source.</p>
            <div className="ingredient-grid">
                {CARBS.map(carb => (
                    <button
                        key={carb.id}
                        className={`ingredient-btn ${selectedCarb.id === carb.id ? 'active' : ''}`}
                        onClick={() => setSelectedCarb(carb)}
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
                {VEGGIES.map(veggie => (
                    <button
                        key={veggie.id}
                        className={`ingredient-btn ${selectedVeggie.id === veggie.id ? 'active' : ''}`}
                        onClick={() => setSelectedVeggie(veggie)}
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

    const renderStep4_Review = () => {

        const proteinMacros = builderPortionSize === 'large' ? selectedProtein.macrosLarge : selectedProtein.macros;
        const totalProtein = proteinMacros.protein + selectedCarb.macros.protein + selectedVeggie.macros.protein;
        const totalCarbs = proteinMacros.carbs + selectedCarb.macros.carbs + selectedVeggie.macros.carbs;
        const totalFat = proteinMacros.fat + selectedCarb.macros.fat + selectedVeggie.macros.fat;
        const totalCalories = proteinMacros.calories + selectedCarb.macros.calories + selectedVeggie.macros.calories;

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
            <header className="customize-header">
                <h1>Build Your Meal</h1>
                <p>Follow the steps to create your perfect custom meal.</p>


            </header>

            {renderProgressBar()}

            <div className="builder-container wizard-layout">
                {/* Main Content Area */}
                <div className="wizard-main">
                    {currentStep === 1 && renderStep1_Protein()}
                    {currentStep === 2 && renderStep2_Carbs()}
                    {currentStep === 3 && renderStep3_Veggies()}
                    {currentStep === 4 && renderStep4_Review()}

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
        </section>
    );
};

export default MealBuilder;
