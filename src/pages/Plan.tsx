import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useState } from 'react';
import { formatOrderForInstagram } from '../utils/orderUtils';
import InstructionModal from '../components/InstructionModal';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './Plan.css';

export default function Plan() {
    const { cartItems, cartTotal, removeFromCart, updateQuantity, canCheckout, validationMessage } = useCart();
    const { macroGoals, isFirstTimeCustomer, toggleCustomerStatus } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate current cart macros
    const cartMacros = cartItems.reduce((acc, item) => {
        return {
            protein: acc.protein + (item.macros.protein * item.quantity),
            carbs: acc.carbs + (item.macros.carbs * item.quantity),
            fats: acc.fats + (item.macros.fat * item.quantity),
            calories: acc.calories + (item.macros.calories * item.quantity),
        };
    }, { protein: 0, carbs: 0, fats: 0, calories: 0 });

    const getProgressColor = (current: number, target: number) => {
        const ratio = current / target;
        if (ratio > 1.1) return 'var(--color-error, #ef4444)'; // Over target
        if (ratio >= 0.9) return 'var(--color-success, #22c55e)'; // On target
        return 'var(--color-primary)'; // Under target
    };

    return (
        <div className="plan-page page-container">
            <header className="plan-header">
                <h1>Your Weekly Plan</h1>
                <p>Review your meals and check if you're hitting your nutrition targets.</p>
            </header>

            <div className="plan-content">
                <div className="plan-items-section">
                    <h2>Selected Meals ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h2>

                    {cartItems.length === 0 ? (
                        <div className="empty-state">
                            <p>Your plan is empty.</p>
                            <Link to="/">
                                <Button>Browse Meals</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="plan-list">
                            {cartItems.map(item => (
                                <div key={item.id} className="plan-item">
                                    <img src={item.image} alt={item.title} className="plan-item-img" />
                                    <div className="plan-item-info">
                                        <h3>{item.title}</h3>
                                        <div className="plan-item-macros">
                                            <span>{item.macros.calories} kcal</span>
                                            <span>• P: {item.macros.protein}g</span>
                                            <span>• C: {item.macros.carbs}g</span>
                                            <span>• F: {item.macros.fat}g</span>
                                        </div>
                                    </div>
                                    <div className="plan-item-controls">
                                        <div className="qty-controls">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                        </div>
                                        <div className="item-total text-right">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <button className="remove-link" onClick={() => removeFromCart(item.id)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="plan-summary-section">
                    <div className="summary-card">
                        <h3>Nutrition Analysis</h3>
                        <p className="subtitle">Total for this plan vs. Daily Goals</p>

                        <div className="macro-comparison">
                            <div className="macro-row">
                                <div className="macro-label">
                                    <span>Protein</span>
                                    <small>{Math.round(cartMacros.protein)}g / {macroGoals.protein}g</small>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min((cartMacros.protein / macroGoals.protein) * 100, 100)}%`,
                                            backgroundColor: getProgressColor(cartMacros.protein, macroGoals.protein)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="macro-row">
                                <div className="macro-label">
                                    <span>Carbs</span>
                                    <small>{Math.round(cartMacros.carbs)}g / {macroGoals.carbs}g</small>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min((cartMacros.carbs / macroGoals.carbs) * 100, 100)}%`,
                                            backgroundColor: getProgressColor(cartMacros.carbs, macroGoals.carbs)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="macro-row">
                                <div className="macro-label">
                                    <span>Fats</span>
                                    <small>{Math.round(cartMacros.fats)}g / {macroGoals.fats}g</small>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min((cartMacros.fats / macroGoals.fats) * 100, 100)}%`,
                                            backgroundColor: getProgressColor(cartMacros.fats, macroGoals.fats)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="macro-row total">
                                <div className="macro-label">
                                    <span>Calories</span>
                                    <small>{Math.round(cartMacros.calories)} / {macroGoals.calories}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="summary-card checkout-card">
                        <h3>Order Summary</h3>

                        <div className="status-toggle" style={{ marginBottom: '1rem' }}>
                            <button
                                className={`status-tab ${isFirstTimeCustomer ? 'active' : ''}`}
                                onClick={() => !isFirstTimeCustomer && toggleCustomerStatus()}
                            >
                                New Customer
                            </button>
                            <button
                                className={`status-tab ${!isFirstTimeCustomer ? 'active' : ''}`}
                                onClick={() => isFirstTimeCustomer && toggleCustomerStatus()}
                            >
                                Returning
                            </button>
                        </div>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Delivery</span>
                            <span>$0.00</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>

                        {!canCheckout && validationMessage && (
                            <div className="validation-msg" style={{ marginTop: '1rem' }}>
                                {validationMessage}
                            </div>
                        )}

                        <Button
                            size="lg"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            disabled={!canCheckout}
                            onClick={() => {
                                const orderText = formatOrderForInstagram(cartItems, cartTotal, isFirstTimeCustomer);
                                navigator.clipboard.writeText(orderText).then(() => {
                                    setIsModalOpen(true);
                                });
                            }}
                        >
                            Place Order via Instagram
                        </Button>
                    </div>
                </div>
            </div>

            <InstructionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onComplete={() => {
                    setIsModalOpen(false);
                    window.open('https://ig.me/m/losmealpreps', '_blank');
                }}
            />
        </div>
    );
}
