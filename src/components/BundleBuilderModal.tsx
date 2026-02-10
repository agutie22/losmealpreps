import React, { useState, useMemo, useEffect } from 'react';
import Button from './Button';
import { PROTEINS, type Macronutrients } from '../data/ingredients';
import './BundleBuilderModal.css';

interface BundleBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (description: string, selections: Record<string, number>, macros: Macronutrients) => void;
    allowedProteinIds: string[];
}

const TARGET_COUNT = 10;

const BundleBuilderModal: React.FC<BundleBuilderModalProps> = ({ isOpen, onClose, onAddToCart, allowedProteinIds }) => {

    // Filter proteins to get the bundle options based on props
    const currentBundleProteins = useMemo(() => {
        return PROTEINS.filter(p => allowedProteinIds.includes(p.id));
    }, [allowedProteinIds]);

    // Initialize selections
    const [selections, setSelections] = useState<Record<string, number>>({});

    // Reset/Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialStates: Record<string, number> = {};
            currentBundleProteins.forEach(p => initialStates[p.id] = 0);
            setSelections(initialStates);
        }
    }, [isOpen, currentBundleProteins]);

    const totalSelected = useMemo(() => {
        return Object.values(selections).reduce((sum, count) => sum + count, 0);
    }, [selections]);

    const handleIncrement = (id: string) => {
        if (totalSelected < TARGET_COUNT) {
            setSelections(prev => ({
                ...prev,
                [id]: (prev[id] || 0) + 1
            }));
        }
    };

    const handleDecrement = (id: string) => {
        if ((selections[id] || 0) > 0) {
            setSelections(prev => ({
                ...prev,
                [id]: prev[id] - 1
            }));
        }
    };

    const handleConfirm = () => {
        if (totalSelected !== TARGET_COUNT) return;

        // Build Description and Calculate Macros
        const descriptionParts: string[] = [];
        const totalMacros: Macronutrients = { protein: 0, carbs: 0, fat: 0, calories: 0 };

        currentBundleProteins.forEach(p => {
            const count = selections[p.id] || 0;
            if (count > 0) {
                descriptionParts.push(`${count}x ${p.name}`);

                // Add macros for this protein * count
                totalMacros.protein += p.macros.protein * count;
                totalMacros.carbs += p.macros.carbs * count;
                totalMacros.fat += p.macros.fat * count;
                totalMacros.calories += p.macros.calories * count;
            }
        });

        const description = `10 Meals (6oz): ${descriptionParts.join(', ')}`;
        onAddToCart(description, selections, totalMacros);

        // Reset handled by useEffect on next open
    };

    if (!isOpen) return null;

    const remaining = TARGET_COUNT - totalSelected;
    const progressPercent = (totalSelected / TARGET_COUNT) * 100;

    return (
        <div className="bundle-modal-overlay" onClick={onClose}>
            <div className="bundle-modal-content" onClick={e => e.stopPropagation()}>
                <button className="bundle-close-btn" onClick={onClose}>&times;</button>

                <div className="bundle-modal-header">
                    <h2>Build Your Bundle</h2>
                    <p>Select your 10 meals from the options below.</p>
                </div>

                <div className="bundle-progress">
                    <span className="progress-text">
                        {totalSelected} / {TARGET_COUNT} Selected
                        {remaining > 0 ? ` (Pick ${remaining} more)` : ' (Ready!)'}
                    </span>
                    <div className="progress-bar-bg">
                        <div
                            className={`progress-bar-fill ${totalSelected === TARGET_COUNT ? 'complete' : ''}`}
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                <div className="protein-selection-list">
                    {currentBundleProteins.map(protein => (
                        <div
                            key={protein.id}
                            className={`protein-item ${selections[protein.id] > 0 ? 'active' : ''}`}
                        >
                            <span className="protein-name">{protein.name}</span>
                            <div className="quantity-controls">
                                <button
                                    className="qty-btn minus"
                                    onClick={() => handleDecrement(protein.id)}
                                    disabled={!selections[protein.id]}
                                >
                                    -
                                </button>
                                <span className="qty-value">{selections[protein.id] || 0}</span>
                                <button
                                    className="qty-btn plus"
                                    onClick={() => handleIncrement(protein.id)}
                                    disabled={totalSelected >= TARGET_COUNT}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bundle-modal-footer">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        style={{ flex: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="lg"
                        disabled={totalSelected !== TARGET_COUNT}
                        onClick={handleConfirm}
                        style={{
                            flex: 2,
                            backgroundColor: totalSelected === TARGET_COUNT ? '#3E2723' : '#cbd5e1',
                            borderColor: totalSelected === TARGET_COUNT ? '#3E2723' : '#cbd5e1',
                            cursor: totalSelected === TARGET_COUNT ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {/* Dynamic price would be better here, but I can hardcode or pass it in later if needed */}
                        Add Bundle
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BundleBuilderModal;
