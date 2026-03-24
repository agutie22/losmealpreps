import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import './BundleDeal.css';

interface BundleDealProps {
    variant?: 'standard' | 'premium';
}


const BundleDeal: React.FC<BundleDealProps> = ({ variant = 'standard' }) => {
    const navigate = useNavigate();

    const isPremium = variant === 'premium';
    const price = isPremium ? 150 : 115;

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
                        <li>GOLDEN LEMON TILAPIA</li>
                        <li>KOREAN BBQ BULGOGI</li>
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
                    onClick={() => navigate(`/build-bundle?type=${variant}`)}
                    style={{
                        backgroundColor: isPremium ? '#B08D55' : '#3E2723',
                        color: isPremium ? '#3E2723' : '#fff',
                        borderColor: isPremium ? '#B08D55' : '#3E2723'
                    }}
                >
                    BUILD BUNDLE
                </Button>
            </div>
        </section>
    );
};

export default BundleDeal;
