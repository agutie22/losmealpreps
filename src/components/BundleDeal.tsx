import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';
import BundleBuilderModal from './BundleBuilderModal';
import { type Macronutrients } from '../data/ingredients';
import './BundleDeal.css';

interface BundleDealProps {
    variant?: 'standard' | 'premium';
}

const STANDARD_PROTEIN_IDS = ['p2', 'p3', 'p5'];
const PREMIUM_PROTEIN_IDS = ['p_ribeye', 'p_shrimp', 'p_salmon'];

const BundleDeal: React.FC<BundleDealProps> = ({ variant = 'standard' }) => {
    const { addToCart } = useCart();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isPremium = variant === 'premium';
    const price = isPremium ? 150 : 115;
    const title = isPremium ? 'PREMIUM BUNDLE DEAL' : '10 MEAL BUNDLE DEAL';
    const proteins = isPremium ? PREMIUM_PROTEIN_IDS : STANDARD_PROTEIN_IDS;

    // Choose image based on variant
    const image = isPremium
        ? 'https://placehold.co/600x600/3E2723/B08D55?text=Premium+Bundle'
        : 'https://placehold.co/600x600/B08D55/3E2723?text=10+Meal+Bundle';

    const handleAddToCart = (description: string, _selections: Record<string, number>, macros: Macronutrients) => {
        addToCart({
            id: `bundle-${variant}-${Date.now()}`,
            title: title,
            description: description,
            image: image,
            price: price,
            macros: macros
        });
        setIsModalOpen(false);
    };

    return (
        <section className={`bundle-deal-card ${isPremium ? 'premium' : ''}`}>
            <div className="wheat-icon">🌾</div>

            <h2 className="bundle-title">
                {isPremium ? (
                    <>
                        <span>PREMIUM</span>
                        <span>BUNDLE DEAL</span>
                    </>
                ) : (
                    <>
                        <span>10 MEAL</span>
                        <span>BUNDLE DEAL</span>
                    </>
                )}
            </h2>

            <div className="bundle-subtitle">10 MEALS (6OZ) ONLY ${price}</div>

            <h3 className="proteins-header">{isPremium ? 'PREMIUM PROTEINS' : 'PROTEINS'}</h3>
            <ul className="proteins-list">
                {isPremium ? (
                    <>
                        <li>RIBEYE STEAK</li>
                        <li>GARLIC BUTTER SHRIMP</li>
                        <li>HONEY GLAZED SALMON</li>
                    </>
                ) : (
                    <>
                        <li>CHIPOTLE CHICKEN</li>
                        <li>CHICKEN THIGH</li>
                        <li>GROUND TURKEY</li>
                    </>
                )}
            </ul>

            <div className="bundle-price">${price}</div>

            <div className="bundle-disclaimer">
                <span className="number-emphasis">10</span> MEALS (6OZ) - <span className="number-emphasis">${price}</span> FLAT
            </div>

            <div className="bundle-actions">
                <Button
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        backgroundColor: isPremium ? '#B08D55' : '#3E2723',
                        color: isPremium ? '#3E2723' : '#fff',
                        borderColor: isPremium ? '#B08D55' : '#3E2723'
                    }}
                >
                    CUSTOMIZE & ADD
                </Button>
            </div>

            <BundleBuilderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={handleAddToCart}
                allowedProteinIds={proteins}
            />
        </section>
    );
};

export default BundleDeal;
