import './Home.css';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

import chefMascot from '../assets/chef_mascot.png';

export default function Home() {
    // Removed: const [meals] = useState(initialMeals);
    const navigate = useNavigate();

    return (
        <div className="page home-page">
            <header className="hero-section">
                <div className="hero-container">
                    <div className="hero-text">
                        <h1>Build Your Own.<br />Fuel Your Ambition.</h1>
                        <p className="hero-subtitle">
                            Fully customizable bowls tailored to your macros.
                            <strong>Fresh ingredients, precise portions, delivered.</strong>
                        </p>
                        <div className="hero-actions">
                            <Button size="lg" onClick={() => navigate('/customize')}>Start Building</Button>
                        </div>
                    </div>
                    <div className="hero-image-wrapper">
                        <img
                            src={chefMascot}
                            alt="Our Head Chef"
                            className="hero-image"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/800x800/0D47A1/FFFFFF?text=Chef+Mascot";
                            }}
                        />
                    </div>
                </div>
            </header>

            <main className="main-content">
                <section className="section-container bg-surface">
                    <div className="cta-split">
                        <div className="cta-content">
                            <h2>How It Works</h2>
                            <p>
                                1. <strong>Choose Your Base</strong>: White Rice, Red Potatoes, or None.<br />
                                2. <strong>Pick Your Protein</strong>: Steak, Chicken, Shrimp, Salmon, or Ground Beef.<br />
                                3. <strong>Add Veggies</strong>: Mixed Vegetables or None.<br />
                                4. <strong>We Cook & Deliver</strong>: Freshly prepared meals right to your door.
                            </p>
                            <Button variant="secondary" onClick={() => navigate('/customize')}>Create Your Bowl</Button>
                        </div>
                        <div className="cta-visual">
                            <div className="macro-preview">
                                <div style={{ background: '#F1F5F9', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '3rem' }}>🥗</span>
                                    <p style={{ marginTop: '1rem', fontWeight: 600 }}>100% Customizable</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

        </div>
    );
}
