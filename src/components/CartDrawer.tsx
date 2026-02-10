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
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        flexShrink: 0,
                        border: `1px solid ${isFirstTimeCustomer ? '#BBDEFB' : '#FFE0B2'}`
                    }}>
                        <div style={{
                            display: 'flex',
                            marginBottom: '1rem',
                            background: 'rgba(255,255,255,0.5)',
                            padding: '4px',
                            borderRadius: '8px',
                            gap: '4px'
                        }}>
                            <button
                                onClick={() => !isFirstTimeCustomer && toggleCustomerStatus()}
                                style={{
                                    flex: 1,
                                    padding: '8px 4px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: isFirstTimeCustomer ? 'white' : 'transparent',
                                    boxShadow: isFirstTimeCustomer ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: isFirstTimeCustomer ? '#0D47A1' : 'inherit',
                                    fontWeight: isFirstTimeCustomer ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}>
                                New Customer
                            </button>
                            <button
                                onClick={() => isFirstTimeCustomer && toggleCustomerStatus()}
                                style={{
                                    flex: 1,
                                    padding: '8px 4px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: !isFirstTimeCustomer ? 'white' : 'transparent',
                                    boxShadow: !isFirstTimeCustomer ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: !isFirstTimeCustomer ? '#E65100' : 'inherit',
                                    fontWeight: !isFirstTimeCustomer ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}>
                                Returning
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>
                                {isFirstTimeCustomer ? '🎉' : '📝'}
                            </span>
                            <div>
                                {isFirstTimeCustomer ? (
                                    <>
                                        <strong>No minimums!</strong>
                                        <div style={{ marginTop: '2px', opacity: 0.9 }}>Try your first meal today. We trust you'll love it!</div>
                                    </>
                                ) : (
                                    <>
                                        <strong>Standard Order Policy</strong>
                                        <div style={{ marginTop: '2px', opacity: 0.9 }}>5 meals minimum OR $60 cart total.</div>
                                    </>
                                )}
                            </div>
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
