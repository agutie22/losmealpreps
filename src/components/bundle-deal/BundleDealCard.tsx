import React, { useMemo } from 'react';
import type { BundleVariant, BundleDealConfig, ProteinOption } from '../../types/menu';
import './bundle-deal.css';

export interface BundleDealCardProps {
    variant: BundleVariant;
    config: BundleDealConfig;
    proteins: ProteinOption[];
    onBuildBundle: (variant: BundleVariant) => void;
}

const STANDARD_CELLS = [
    'linear-gradient(160deg, #C0DD97 0%, #7EB53A 100%)',
    'linear-gradient(160deg, #FAC775 0%, #C88B1A 100%)',
    'linear-gradient(160deg, #D4B896 0%, #9A7650 100%)',
    'linear-gradient(160deg, #5DCAA5 0%, #1A876A 100%)',
    'linear-gradient(160deg, #E8C99A 0%, #B58A52 100%)',
    'linear-gradient(160deg, #F0C870 0%, #BA7517 100%)',
];

const PREMIUM_CELLS = [
    'linear-gradient(160deg, #F4C56A 0%, #BA7517 100%)',
    'linear-gradient(160deg, #E8A862 0%, #A05820 100%)',
    'linear-gradient(160deg, #D4956A 0%, #8B4A20 100%)',
    'linear-gradient(160deg, #F0D48A 0%, #C89A2A 100%)',
    'linear-gradient(160deg, #E6B870 0%, #9A6818 100%)',
    'linear-gradient(160deg, #C8A060 0%, #7A5010 100%)',
];

const BundleDealCard: React.FC<BundleDealCardProps> = ({ variant, config, proteins, onBuildBundle }) => {
    const isPremium = variant === 'premium';
    const cells = isPremium ? PREMIUM_CELLS : STANDARD_CELLS;

    const proteinLine = useMemo(
        () => (proteins.length > 0 ? proteins.map((p) => p.name).join(' · ') : 'See builder for options'),
        [proteins]
    );

    const displayName = isPremium ? 'Premium Bundle' : 'Standard Bundle';
    const perMeal = config.price / config.mealCount;
    const perMealStr = perMeal % 1 === 0 ? `$${perMeal}` : `$${perMeal.toFixed(2)}`;

    return (
        <article className={`bundle-card${isPremium ? ' bundle-card--premium' : ''}`}>
            {/* ── Photo grid ── */}
            <div className="bundle-card__image-area">
                <div className="bundle-card__photo-grid">
                    {cells.map((bg, i) => (
                        <div key={i} className="bundle-card__photo-cell" style={{ background: bg }} />
                    ))}
                </div>
                {isPremium && (
                    <span className="bundle-card__badge">PREMIUM</span>
                )}
            </div>

            {/* ── Body ── */}
            <div className="bundle-card__body">
                <div className="bundle-card__title-row">
                    <span className="bundle-card__name">{displayName}</span>
                    <span className="bundle-card__per-meal">{perMealStr}/meal</span>
                </div>

                <p className="bundle-card__protein-list" title={proteinLine}>
                    {proteinLine}
                </p>

                <div className="bundle-card__divider" />

                <div className="bundle-card__footer-row">
                    <div className="bundle-card__price-block">
                        <span className="bundle-card__price">${config.price}</span>
                        <span className="bundle-card__size">{config.mealCount} meals · 6oz</span>
                    </div>
                    <button
                        className="bundle-card__build-btn"
                        onClick={() => onBuildBundle(variant)}
                    >
                        Build →
                    </button>
                </div>
            </div>
        </article>
    );
};

export default BundleDealCard;
