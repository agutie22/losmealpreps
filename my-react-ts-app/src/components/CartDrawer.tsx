import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { formatOrderForInstagram } from '../utils/orderUtils';
import InstructionModal from './InstructionModal';
import { Link } from 'react-router-dom';
import Button from './Button';
import './CartDrawer.css';

const CartDrawer: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {
        cartItems,
        cartTotal,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        toggleCart,
        canCheckout,
        validationMessage
    } = useCart();

    const { isFirstTimeCustomer, toggleCustomerStatus } = useUser();

    if (!isCartOpen) return null;

    return (
        <div className="cart-overlay" onClick={toggleCart}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                <div className="cart-header">
                    <h3>Your Plan</h3>
                    <button className="close-btn" onClick={toggleCart}>&times;</button>
                </div>

                <div className="cart-items">
                    {/* User Status Banner - Inside scrollable area */}
                    <div className="user-status-banner" style={{
                        backgroundColor: isFirstTimeCustomer ? '#E3F2FD' : '#FFF3E0',
                        color: isFirstTimeCustomer ? '#0D47A1' : '#E65100',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        flexShrink: 0
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {isFirstTimeCustomer ? '🎉 First-Time Customer' : '👤 Returning Customer'}
                        </div>
                        {isFirstTimeCustomer ? (
                            <span>No minimums! Try your first meal today.</span>
                        ) : (
                            <span>Standard terms: 5 meals or $60 minimum.</span>
                        )}
                        <div style={{ marginTop: '0.5rem' }}>
                            <button
                                onClick={toggleCustomerStatus}
                                style={{
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    color: 'inherit',
                                    opacity: 0.8
                                }}
                            >
                                (Switch mode for Demo)
                            </button>
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <p className="empty-cart">Your cart is empty.</p>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.title} className="cart-item-img" />
                                <div className="cart-item-details">
                                    <h4>{item.title}</h4>
                                    <p className="cart-item-price">${item.price.toFixed(2)}</p>
                                    <div className="qty-controls">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>
                                </div>
                                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-footer">
                    {!canCheckout && validationMessage && (
                        <div className="validation-msg">
                            {validationMessage}
                        </div>
                    )}
                    <div className="cart-total">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <Link to="/plan" className="view-plan-link" onClick={toggleCart}>
                            View Full Plan & Analytics &rarr;
                        </Link>
                    </div>

                    <Button
                        size="lg"
                        disabled={!canCheckout}
                        onClick={() => {
                            const orderText = formatOrderForInstagram(cartItems, cartTotal, isFirstTimeCustomer);
                            navigator.clipboard.writeText(orderText).then(() => {
                                setIsModalOpen(true);
                            });
                        }}
                        style={{ width: '100%' }}
                    >
                        Copy Order & Go to Instagram
                    </Button>
                </div>
            </div>

            <InstructionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onComplete={() => {
                    setIsModalOpen(false);
                    // Also close the cart drawer when redirecting, for a cleaner experience
                    toggleCart();
                    window.open('https://ig.me/m/losmealpreps', '_blank');
                }}
            />
        </div>
    );
};

export default CartDrawer;
