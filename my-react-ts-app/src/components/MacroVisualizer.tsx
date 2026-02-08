import { type HTMLAttributes } from 'react';
import './MacroVisualizer.css';

interface MacroVisualizerProps extends HTMLAttributes<HTMLDivElement> {
    protein: number;
    carbs: number;
    fat: number;
}

export default function MacroVisualizer({ protein, carbs, fat, className = '', ...props }: MacroVisualizerProps) {
    // Normalize sizes based on a max value (e.g., 60g) to keep shapes relative but constrained
    const MAX_VAL = 60;

    const getSize = (val: number) => {
        // scale 0 to MAX_VAL to some pixel range, e.g., 20px to 60px
        const minPx = 20;
        const maxPx = 60;
        const size = Math.min(val, MAX_VAL) / MAX_VAL * (maxPx - minPx) + minPx;
        return `${size}px`;
    };

    return (
        <div className={`macro-visualizer ${className}`} {...props}>
            <div className="macro-item">
                <div
                    className="shape square protein"
                    style={{ width: getSize(protein), height: getSize(protein) }}
                    title={`Protein: ${protein}g`}
                />
                <span className="macro-label">P: {protein}g</span>
            </div>
            <div className="macro-item">
                <div
                    className="shape circle carbs"
                    style={{ width: getSize(carbs), height: getSize(carbs) }}
                    title={`Carbs: ${carbs}g`}
                />
                <span className="macro-label">C: {carbs}g</span>
            </div>
            <div className="macro-item">
                <div
                    className="shape triangle fat"
                    style={{
                        borderLeftWidth: `calc(${getSize(fat)} / 2)`,
                        borderRightWidth: `calc(${getSize(fat)} / 2)`,
                        borderBottomWidth: getSize(fat),
                    }}
                    title={`Fat: ${fat}g`}
                />
                <span className="macro-label">F: {fat}g</span>
            </div>
        </div>
    );
}
