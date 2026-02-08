import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import Button from './Button';
import '../pages/Customize.css'; // Utilizing existing styles

const MacroCalculator = () => {
    const { macroGoals, updateMacroGoals, dietaryPreferences, updateDietaryPreferences } = useUser();

    // Macro Calculator State
    const [localGoals, setLocalGoals] = useState(macroGoals);
    const [localPrefs, setLocalPrefs] = useState(dietaryPreferences);

    // Goal Presets
    const [selectedGoal, setSelectedGoal] = useState<'weight-loss' | 'muscle-gain' | 'maintain' | 'custom'>('maintain');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setLocalGoals(macroGoals);
        setLocalPrefs(dietaryPreferences);
    }, [macroGoals, dietaryPreferences]);

    const handleChange = (field: keyof typeof macroGoals, value: number) => {
        const updated = { ...localGoals, [field]: value };
        updated.calories = (updated.protein * 4) + (updated.carbs * 4) + (updated.fats * 9);
        setLocalGoals(updated);
    };

    const handlePrefChange = (field: keyof typeof dietaryPreferences, value: any) => {
        setLocalPrefs(prev => ({ ...prev, [field]: value }));
    };

    const toggleRestriction = (restriction: string) => {
        setLocalPrefs(prev => {
            const current = prev.restrictions;
            const updated = current.includes(restriction)
                ? current.filter(r => r !== restriction)
                : [...current, restriction];
            return { ...prev, restrictions: updated };
        });
    };

    const handleSave = () => {
        updateMacroGoals(localGoals);
        updateDietaryPreferences(localPrefs);
        alert('Preferences saved!');
    };

    const calculatePercentage = (val: number, type: 'protein' | 'carbs' | 'fats') => {
        const calsFromMacro = type === 'fats' ? val * 9 : val * 4;
        return Math.round((calsFromMacro / localGoals.calories) * 100) || 0;
    }

    const applyGoal = (goal: 'weight-loss' | 'muscle-gain' | 'maintain') => {
        setSelectedGoal(goal);
        let newGoals = { ...localGoals };

        switch (goal) {
            case 'weight-loss':
                // High protein, lower carb/fat
                newGoals = { protein: 180, carbs: 120, fats: 55, calories: 0 };
                break;
            case 'muscle-gain':
                // High protein & carbs
                newGoals = { protein: 200, carbs: 250, fats: 70, calories: 0 };
                break;
            case 'maintain':
                // Balanced
                newGoals = { protein: 150, carbs: 180, fats: 65, calories: 0 };
                break;
        }
        // Recalc calories
        newGoals.calories = (newGoals.protein * 4) + (newGoals.carbs * 4) + (newGoals.fats * 9);
        setLocalGoals(newGoals);
    };

    const handleGoalClick = (goal: 'weight-loss' | 'muscle-gain' | 'maintain') => {
        applyGoal(goal);
        setShowAdvanced(false); // Hide advanced controls when picking a preset
    };

    const handleAdvancedToggle = () => {
        setShowAdvanced(!showAdvanced);
        if (!showAdvanced) setSelectedGoal('custom');
    };

    return (
        <section>
            <header className="customize-header">
                <h1>Macro Calculator</h1>
                <p>Select a goal below and we'll calculate the perfect macros for you.</p>
            </header>

            <div className="customize-content">
                <div className="macro-controls">

                    {/* Goal Selection Buttons */}
                    <div className="goal-selection">
                        <button
                            className={`goal-btn ${selectedGoal === 'weight-loss' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('weight-loss')}
                        >
                            <span className="goal-icon">📉</span>
                            <span className="goal-text">Lose Weight</span>
                            <small>Lean & Low Carb</small>
                        </button>

                        <button
                            className={`goal-btn ${selectedGoal === 'muscle-gain' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('muscle-gain')}
                        >
                            <span className="goal-icon">💪</span>
                            <span className="goal-text">Build Muscle</span>
                            <span className="goal-text">Build Muscle</span>
                            <small>High Protein & Carbs</small>
                        </button>

                        <button
                            className={`goal-btn ${selectedGoal === 'maintain' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('maintain')}
                        >
                            <span className="goal-icon">⚖️</span>
                            <span className="goal-text">Maintain</span>
                            <small>Balanced Lifestyle</small>
                        </button>
                    </div>

                    {/* Dietary Restrictions - Always Visible */}
                    <div className="control-section">
                        <h3>Dietary Preferences</h3>
                        <div className="dietary-grid">
                            {['Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb'].map(diet => (
                                <label key={diet} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={localPrefs.restrictions.includes(diet)}
                                        onChange={() => toggleRestriction(diet)}
                                    />
                                    {diet}
                                </label>
                            ))}
                        </div>
                        <div className="allergy-input-group">
                            <label>Allergies (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Peanuts, Shellfish..."
                                value={localPrefs.allergies}
                                onChange={(e) => handlePrefChange('allergies', e.target.value)}
                                className="text-input"
                            />
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <div className="advanced-toggle-container">
                        <button className="text-link" onClick={handleAdvancedToggle}>
                            {showAdvanced ? 'Hide Advanced Options' : 'Customize Macros Manually'}
                        </button>
                    </div>

                    {/* Advanced Section (Rest of the controls) */}
                    {showAdvanced && (
                        <div className="advanced-section">
                            {/* Portion Size Toggle */}
                            <div className="control-section">
                                <h3>Portion Size</h3>
                                <div className="portion-toggle">
                                    <button
                                        className={`portion-btn ${localPrefs.portionSize === '6oz' ? 'active' : ''}`}
                                        onClick={() => handlePrefChange('portionSize', '6oz')}
                                    >
                                        6oz <small>(Standard)</small>
                                    </button>
                                    <button
                                        className={`portion-btn ${localPrefs.portionSize === '8oz' ? 'active' : ''}`}
                                        onClick={() => handlePrefChange('portionSize', '8oz')}
                                    >
                                        8oz <small>(Large)</small>
                                    </button>
                                </div>
                            </div>

                            <h3>Macro Goals</h3>
                            <div className="control-group">
                                <label>
                                    Protein (g)
                                    <span className="percentage-badge protein">{calculatePercentage(localGoals.protein, 'protein')}%</span>
                                </label>
                                <div className="slider-container">
                                    <input
                                        type="range" min="50" max="300" step="5"
                                        value={localGoals.protein}
                                        onChange={(e) => handleChange('protein', Number(e.target.value))}
                                        className="macro-slider protein-slider"
                                    />
                                    <input
                                        type="number"
                                        value={localGoals.protein}
                                        onChange={(e) => handleChange('protein', Number(e.target.value))}
                                        className="macro-input"
                                    />
                                </div>
                            </div>

                            <div className="control-group">
                                <label>
                                    Carbs (g)
                                    <span className="percentage-badge carbs">{calculatePercentage(localGoals.carbs, 'carbs')}%</span>
                                </label>
                                <div className="slider-container">
                                    <input
                                        type="range" min="20" max="500" step="5"
                                        value={localGoals.carbs}
                                        onChange={(e) => handleChange('carbs', Number(e.target.value))}
                                        className="macro-slider carbs-slider"
                                    />
                                    <input
                                        type="number"
                                        value={localGoals.carbs}
                                        onChange={(e) => handleChange('carbs', Number(e.target.value))}
                                        className="macro-input"
                                    />
                                </div>
                            </div>

                            <div className="control-group">
                                <label>
                                    Fats (g)
                                    <span className="percentage-badge fats">{calculatePercentage(localGoals.fats, 'fats')}%</span>
                                </label>
                                <div className="slider-container">
                                    <input
                                        type="range" min="20" max="150" step="1"
                                        value={localGoals.fats}
                                        onChange={(e) => handleChange('fats', Number(e.target.value))}
                                        className="macro-slider fats-slider"
                                    />
                                    <input
                                        type="number"
                                        value={localGoals.fats}
                                        onChange={(e) => handleChange('fats', Number(e.target.value))}
                                        className="macro-input"
                                    />
                                </div>
                            </div>
                        </div> /* End of Advanced Section */
                    )}

                    <div className="total-calories">
                        <h3>Target Daily Calories</h3>
                        <div className="calorie-display">{localGoals.calories} kcal</div>
                    </div>

                    <Button size="lg" onClick={handleSave} style={{ marginTop: '2rem', width: '100%' }}>
                        Save Goals
                    </Button>
                </div>

                <div className="macro-visualizer">
                    {/* Simple CSS Pie Chart or Bar Visualization */}
                    <div className="chart-container">
                        <div className="visualizer-circle" style={{
                            background: `conic-gradient(
                        var(--color-protein) 0% ${calculatePercentage(localGoals.protein, 'protein')}%,
                        var(--color-carbs) ${calculatePercentage(localGoals.protein, 'protein')}% ${calculatePercentage(localGoals.protein, 'protein') + calculatePercentage(localGoals.carbs, 'carbs')}%,
                        var(--color-fats) ${calculatePercentage(localGoals.protein, 'protein') + calculatePercentage(localGoals.carbs, 'carbs')}% 100%
                    )`
                        }}>
                            <div className="inner-circle">
                                <span>{localGoals.calories}</span>
                                <small>kcal</small>
                            </div>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="dot protein"></span> Protein</div>
                            <div className="legend-item"><span className="dot carbs"></span> Carbs</div>
                            <div className="legend-item"><span className="dot fats"></span> Fats</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MacroCalculator;
