import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import '../pages/Customize.css'; // Reusing existing styles for consistency

const Consultation = () => {
    const { macroGoals, dietaryPreferences } = useUser();

    // Local state for the calculator - we don't necessarily need to update the global context immediately
    // unless we want it to persist. For a consultation request, local state is fine.
    const [localGoals, setLocalGoals] = useState(macroGoals);
    const [localPrefs, setLocalPrefs] = useState(dietaryPreferences);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

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



    const toggleRestriction = (restriction: string) => {
        setLocalPrefs(prev => {
            const current = prev.restrictions;
            const updated = current.includes(restriction)
                ? current.filter(r => r !== restriction)
                : [...current, restriction];
            return { ...prev, restrictions: updated };
        });
    };

    const applyGoal = (goal: 'weight-loss' | 'muscle-gain' | 'maintain') => {
        setSelectedGoal(goal);
        let newGoals = { ...localGoals };

        switch (goal) {
            case 'weight-loss':
                newGoals = { protein: 180, carbs: 120, fats: 55, calories: 0 };
                break;
            case 'muscle-gain':
                newGoals = { protein: 200, carbs: 250, fats: 70, calories: 0 };
                break;
            case 'maintain':
                newGoals = { protein: 150, carbs: 180, fats: 65, calories: 0 };
                break;
        }
        newGoals.calories = (newGoals.protein * 4) + (newGoals.carbs * 4) + (newGoals.fats * 9);
        setLocalGoals(newGoals);
    };

    const handleGoalClick = (goal: 'weight-loss' | 'muscle-gain' | 'maintain') => {
        applyGoal(goal);
        setShowAdvanced(false);
    };

    const handleAdvancedToggle = () => {
        setShowAdvanced(!showAdvanced);
        if (!showAdvanced) setSelectedGoal('custom');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');

        // Mock API call
        setTimeout(() => {
            console.log("Consultation Request Submitted", {
                contact: formData,
                goals: localGoals,
                preferences: localPrefs
            });
            setFormStatus('success');
        }, 1500);
    };

    if (formStatus === 'success') {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h1>Request Received!</h1>
                <p>Thank you, {formData.name}. We'll review your goals and get back to you within 24 hours with a personalized meal plan proposal.</p>
                <Button onClick={() => window.location.href = '/'}>Return Home</Button>
            </div>
        );
    }

    return (
        <div className="page-container consultation-page">
            <header className="customize-header">
                <h1>Free Macro Consultation</h1>
                <p>Not sure what you need? Let us design a custom meal plan just for you.</p>
            </header>

            <form onSubmit={handleSubmit} className="consultation-form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Contact Information */}
                <section className="form-section" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                    <h3>Contact Information</h3>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Name</label>
                            <input
                                required
                                type="text"
                                className="text-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                required
                                type="email"
                                className="text-input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Phone (Optional)</label>
                            <input
                                type="tel"
                                className="text-input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>
                </section>

                {/* Macro Calculator / Goals */}
                <section className="form-section" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                    <h3>Your Goals</h3>
                    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Help us understand your targets so we can build the perfect plan.</p>

                    <div className="goal-selection" style={{ marginBottom: '2rem' }}>
                        <button
                            type="button"
                            className={`goal-btn ${selectedGoal === 'weight-loss' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('weight-loss')}
                        >
                            <span className="goal-icon">📉</span>
                            <span className="goal-text">Lose Weight</span>
                        </button>
                        <button
                            type="button"
                            className={`goal-btn ${selectedGoal === 'muscle-gain' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('muscle-gain')}
                        >
                            <span className="goal-icon">💪</span>
                            <span className="goal-text">Build Muscle</span>
                        </button>
                        <button
                            type="button"
                            className={`goal-btn ${selectedGoal === 'maintain' ? 'active' : ''}`}
                            onClick={() => handleGoalClick('maintain')}
                        >
                            <span className="goal-icon">⚖️</span>
                            <span className="goal-text">Maintain</span>
                        </button>
                    </div>

                    <div className="calculated-macros-preview" style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        textAlign: 'center',
                        gap: '1rem'
                    }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-protein)' }}>{localGoals.protein}g</div>
                            <small>Protein</small>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-carbs)' }}>{localGoals.carbs}g</div>
                            <small>Carbs</small>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-fats)' }}>{localGoals.fats}g</div>
                            <small>Fats</small>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{localGoals.calories}</div>
                            <small>Calories</small>
                        </div>
                    </div>

                    <div className="advanced-toggle-container" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button type="button" className="text-link" onClick={handleAdvancedToggle}>
                            {showAdvanced ? 'Hide Advanced Options' : 'Adjust Macros Manually'}
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="advanced-section" style={{ marginTop: '1.5rem' }}>
                            <div className="control-group">
                                <label>Protein (g)</label>
                                <input
                                    type="range" min="50" max="300" step="5"
                                    value={localGoals.protein}
                                    onChange={(e) => handleChange('protein', Number(e.target.value))}
                                    className="macro-slider protein-slider"
                                />
                            </div>
                            <div className="control-group">
                                <label>Carbs (g)</label>
                                <input
                                    type="range" min="20" max="500" step="5"
                                    value={localGoals.carbs}
                                    onChange={(e) => handleChange('carbs', Number(e.target.value))}
                                    className="macro-slider carbs-slider"
                                />
                            </div>
                            <div className="control-group">
                                <label>Fats (g)</label>
                                <input
                                    type="range" min="20" max="150" step="5"
                                    value={localGoals.fats}
                                    onChange={(e) => handleChange('fats', Number(e.target.value))}
                                    className="macro-slider fats-slider"
                                />
                            </div>
                        </div>
                    )}
                </section>

                <section className="form-section" style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
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
                </section>

                <section className="form-section">
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Additional Notes / Questions</label>
                    <textarea
                        className="text-input"
                        rows={4}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Tell us about your activity level, specific dislikes, or anything else..."
                    />
                </section>

                <Button
                    size="lg"
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    style={{ width: '100%', marginTop: '2rem' }}
                >
                    {formStatus === 'submitting' ? 'Sending Request...' : 'Request Consultation'}
                </Button>

            </form>
        </div>
    );
};

export default Consultation;
