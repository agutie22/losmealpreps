import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import Button from './Button';
import BundleBuilderModal from './BundleBuilderModal';
import { type Macronutrients } from '../data/ingredients';
import './BundleDeal.css';

const BundleDeal: React.FC = () => {
    const { addToCart } = useCart();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddToCart = (description: string, _selections: Record<string, number>, macros: Macronutrients) => {
        addToCart({
            id: `bundle-10-meals-${Date.now()}`,
            title: '10 Meal Bundle Deal',
            description: description,
            image: 'https://placehold.co/600x600/B08D55/3E2723?text=10+Meal+Bundle',
            price: 115,
            macros: macros
        });
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bundle-deal-card">
                <h2 className="bundle-title">
                    <span>Bundle</span>
                    <span>Deal</span>
                </h2>

                <div className="wheat-icon">🌾</div>

                <div className="bundle-subtitle">10 Meals • 6oz Only</div>

                <h3 className="proteins-header">Proteins</h3>

                <ul className="proteins-list">
                    <li>Chipotle Style Chicken Breast</li>
                    <li>Marinated Chicken Thigh</li>
                    <li>Serrano Ground Turkey</li>
                </ul>

                <div className="bundle-price">$115</div>

                <p className="bundle-disclaimer">
                    Mix & Match Within These <span className="number-emphasis">3</span> Options
                </p>

                <div className="bundle-actions">
                    <Button
                        size="lg"
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            backgroundColor: '#3E2723',
                            borderColor: '#3E2723',
                            color: '#B08D55',
                            width: '100%'
                        }}
                    >
                        Customize & Add
                    </Button>
                </div>
            </div>

            <BundleBuilderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={handleAddToCart}
            />
        </>
    );
};

export default BundleDeal;
