import './Home.css';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import BibleQuote from '../components/BibleQuote';

import chefMascot from '../assets/chef_mascot.png';
import BundleDeal from '../components/BundleDeal';

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

                        <BibleQuote
                            verse="So whether you eat or drink or whatever you do, do it all for the glory of God."
                            reference="1 Corinthians 10:31"
                            className="hero-quote"
                        />

                        <div className="hero-actions">
                            <Button size="lg" onClick={() => navigate('/customize')}>Start Building</Button>
                        </div>
                    </div>
                    {/* ... keep hero image ... */}
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

            <section className="section-container" style={{ paddingBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                    <BundleDeal variant="standard" />
                    <BundleDeal variant="premium" />
                </div>
            </section>

            <main className="main-content">
                {/* Mission Section */}
                <section className="section-container">
                    <BibleQuote
                        verse="Dear friend, I pray that you may enjoy good health and that all may go well with you, even as your soul is getting along well."
                        reference="3 John 1:2"
                        description="Our Prayer For You"
                    />
                </section>

                <section className="section-container bg-surface">
                    <div className="cta-split">
                        {/* ... keep rest of content ... */}
                        <div className="cta-content">
                            <h2>How It Works</h2>
                            <div className="how-it-works-steps">
                                <div className="step-item">
                                    <span className="step-number">1</span>
                                    <div className="step-text">
                                        <strong>Pick Your Protein</strong>
                                        <p>Steak, Chicken, Shrimp, Salmon, Tilapia, Bulgogi, Tri Tip or Ground Beef.</p>
                                    </div>
                                </div>
                                <div className="step-item">
                                    <span className="step-number">2</span>
                                    <div className="step-text">
                                        <strong>Select Your Carbs</strong>
                                        <p>Jasmine Rice, Red Potatoes, or Skip for low carb.</p>
                                    </div>
                                </div>
                                <div className="step-item">
                                    <span className="step-number">3</span>
                                    <div className="step-text">
                                        <strong>Add Veggies</strong>
                                        <p>Fresh Mixed Vegetables or None.</p>
                                    </div>
                                </div>
                                <div className="step-item">
                                    <span className="step-number">4</span>
                                    <div className="step-text">
                                        <strong>We Cook & Deliver</strong>
                                        <p>Chef-prepared meals delivered right to your door.</p>
                                    </div>
                                </div>
                            </div>
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
