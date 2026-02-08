import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Meal } from '../data/meals';
import { useUser } from './UserContext';
import Toast from '../components/Toast';

export interface CartItem extends Meal {
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (meal: Meal) => void;
    removeFromCart: (mealId: string) => void;
    updateQuantity: (mealId: string, quantity: number) => void;
    cartTotal: number;
    totalItems: number;
    canCheckout: boolean;
    validationMessage: string | null;
    isCartOpen: boolean;
    toggleCart: () => void;
    showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { isFirstTimeCustomer } = useUser();

    // Toast Logic
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const hideToast = () => {
        setToastMessage(null);
    };

    const addToCart = (meal: Meal) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === meal.id);
            if (existing) {
                return prev.map(item =>
                    item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...meal, quantity: 1 }];
        });
        showToast(`Added ${meal.title} to your plan`);
    };

    const removeFromCart = (mealId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== mealId));
    };

    const updateQuantity = (mealId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(mealId);
            return;
        }
        setCartItems(prev => prev.map(item =>
            item.id === mealId ? { ...item, quantity } : item
        ));
    };

    const toggleCart = () => setIsCartOpen(prev => !prev);

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Business Logic
    let canCheckout = false;
    let validationMessage: string | null = null;

    if (cartItems.length === 0) {
        canCheckout = false;
        validationMessage = "Your cart is empty.";
    } else if (isFirstTimeCustomer) {
        // First time: No minimum
        canCheckout = true;
        validationMessage = null;
    } else {
        // Returning: 5 meals OR $60 min
        const meetsMealCount = totalItems >= 5;
        const meetsMinTotal = cartTotal >= 60;

        if (meetsMealCount || meetsMinTotal) {
            canCheckout = true;
            validationMessage = null;
        } else {
            canCheckout = false;
            const mealsNeeded = 5 - totalItems;
            const amountNeeded = 60 - cartTotal;

            if (mealsNeeded > 0 && amountNeeded > 0) {
                validationMessage = `Add ${mealsNeeded} more meals OR $${amountNeeded.toFixed(2)} to checkout.`;
            } else if (mealsNeeded > 0) {
                validationMessage = `Add ${mealsNeeded} more meals to checkout.`;
            } else {
                validationMessage = `Add $${amountNeeded.toFixed(2)} more to checkout.`;
            }
        }
    }

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            cartTotal,
            totalItems,
            canCheckout,
            validationMessage,
            isCartOpen,
            toggleCart,
            showToast
        }}>
            {children}
            <Toast
                message={toastMessage || ''}
                isVisible={!!toastMessage}
                onClose={hideToast}
            />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
