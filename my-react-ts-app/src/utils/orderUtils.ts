import type { CartItem } from '../context/CartContext';

export const formatOrderForInstagram = (
    cartItems: CartItem[],
    total: number,
    isFirstTime: boolean
): string => {
    const header = "Hello! I'd like to place an order from the website:";

    const itemsList = cartItems
        .map(item => {
            const desc = item.description ? `\n   (${item.description})` : '';
            return `- ${item.quantity}x ${item.title}${desc}`;
        })
        .join('\n');

    const customerType = isFirstTime ? "First-Time Customer" : "Returning Customer";

    return `${header}\n\n${itemsList}\n\nTotal: $${total.toFixed(2)}\nType: ${customerType}\n\n(Copied from Los Meal Preps App)`;
};
