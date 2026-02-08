import { type HTMLAttributes } from 'react';
import './MacroTracker.css';

interface MacroTrackerProps extends HTMLAttributes<HTMLDivElement> {
    protein: number;
    carbs: number;
    fat: number;
}

export default function MacroTracker({ protein, carbs, fat, className = '', ...props }: MacroTrackerProps) {
    // Max values for normalization (assuming a typical high-protein meal)
    // You might want to make these props or dynamic later
    const MAX_PROTEIN = 60;
    const MAX_CARBS = 60;
    const MAX_FAT = 30;

    const getPercentage = (val: number, max: number) => Math.min(100, (val / max) * 100);

    return (
        <div className={`macro-tracker ${className}`} {...props}>
            <div className="macro-bar-container">
                <div className="macro-info">
                    <span className="macro-name">Protein</span>
                    <span className="macro-value">{protein}g</span>
                </div>
                <div className="progress-bg">
                    <div
                        className="progress-fill protein"
                        style={{ width: `${getPercentage(protein, MAX_PROTEIN)}%` }}
                    />
                </div>
            </div>

            <div className="macro-bar-container">
                <div className="macro-info">
                    <span className="macro-name">Carbs</span>
                    <span className="macro-value">{carbs}g</span>
                </div>
                <div className="progress-bg">
                    <div
                        className="progress-fill carbs"
                        style={{ width: `${getPercentage(carbs, MAX_CARBS)}%` }}
                    />
                </div>
            </div>

            <div className="macro-bar-container">
                <div className="macro-info">
                    <span className="macro-name">Fat</span>
                    <span className="macro-value">{fat}g</span>
                </div>
                <div className="progress-bg">
                    <div
                        className="progress-fill fat"
                        style={{ width: `${getPercentage(fat, MAX_FAT)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
