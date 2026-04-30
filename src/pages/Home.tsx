import './Home.css';
import Button from '../components/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import BibleQuote from '../components/BibleQuote';
import BundleDeal from '../components/BundleDeal';
import Feed from '../components/Feed';
import { useCart } from '../context/CartContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useMenu } from '../context/MenuContext';

const HERO_CELLS = [
    'linear-gradient(160deg, #C0DD97 0%, #7EB53A 100%)',
    'linear-gradient(160deg, #F0997B 0%, #C45830 100%)',
    'linear-gradient(160deg, #FAC775 0%, #C88B1A 100%)',
    'linear-gradient(160deg, #5DCAA5 0%, #1A876A 100%)',
];

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { menu, loading: menuLoading, usingFallback, refreshMenu, error: menuError } = useMenu();
    const { addToCart } = useCart();

    useEffect(() => {
        void refreshMenu();
    }, [refreshMenu]);

    useEffect(() => {
        if ((location.state as { scrollToBundles?: boolean })?.scrollToBundles) {
            setTimeout(() => {
                document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [location.state]);

    const handleSeeBundles = () => {
        document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="page home-page">

            {/* ── Hero ── */}
            <header className="hero-section">
                <div className="hero-container">
                    <div className="hero-text">
                        <p className="hero-eyebrow">MACRO-PORTIONED · COOKED FRESH WEEKLY</p>
                        <h1 className="hero-h1">Build your bowl.<br />Hit your macros.</h1>
                        <p className="hero-subtitle">
                            Chef-prepared meals tailored to your goals — fresh pickup or LA delivery every week.
                        </p>
                        <div className="hero-actions">
                            <Button size="lg" onClick={() => {
                                document.getElementById('meals')?.scrollIntoView({ behavior: 'smooth' });
                            }}>Start building</Button>
                            <button className="btn btn-outline btn-lg" onClick={handleSeeBundles}>See bundles</button>
                        </div>
                    </div>

                    <div className="hero-photo-grid">
                        {HERO_CELLS.map((bg, i) => (
                            <div key={i} className="hero-photo-cell" style={{ background: bg }} />
                        ))}
                    </div>
                </div>
            </header>

            {/* ── Trust strip ── */}
            <div className="trust-strip">
                <span>✓ Macro-tracked</span>
                <span>✓ Fresh, never frozen</span>
                <span>✓ Local LA delivery</span>
                <span>✓ Skip anytime</span>
            </div>

            {/* ── Live `meal_items` when Supabase is configured; else bundled demo from `data/meals` ── */}
            {!isSupabaseConfigured && (
                <section id="meals" className="section-container home-signature-meals" aria-label="Signature meals">
                    <h2 className="section-title">Signature meals</h2>
                    <p className="section-subtitle">Demo list (add Vite env keys to use your admin menu).</p>
                    <Feed 
                        meals={menu.meals} 
                        onAdd={addToCart} 
                        onCustomize={(meal) => navigate(`/customize?proteinName=${encodeURIComponent(meal.title)}`)} 
                    />
                </section>
            )}

            {isSupabaseConfigured && !usingFallback && (
                <section id="meals" className="section-container home-signature-meals" aria-label="Signature meals">
                    <h2 className="section-title">Signature meals</h2>
                    <p className="section-subtitle">
                        Pre-built plates from our kitchen. Only meals marked <strong>Live</strong> in the admin (not
                        draft) are listed here.
                    </p>
                    {menuLoading && (
                        <p className="section-subtitle" aria-live="polite">Loading the latest menu…</p>
                    )}
                    {!menuLoading && menu.meals.length === 0 && (
                        <p className="section-subtitle home-menu-empty" role="status">
                            There are no published meals yet. In Admin → Meals, turn on <strong>Live</strong> and save
                            your changes, then return to this page to see them.
                        </p>
                    )}
                    {!menuLoading && menu.meals.length > 0 && (
                        <Feed 
                            meals={menu.meals} 
                            onAdd={addToCart} 
                            onCustomize={(meal) => navigate(`/customize?proteinName=${encodeURIComponent(meal.title)}`)} 
                        />
                    )}
                </section>
            )}

            {isSupabaseConfigured && usingFallback && menuError && (
                <section
                    className="section-container home-signature-meals"
                    aria-label="Signature meals unavailable"
                >
                    <h2 className="section-title">Signature meals</h2>
                    <p className="home-menu-fallback" role="alert">
                        {menuError} The fixed meal list is hidden until the menu can load.
                    </p>
                </section>
            )}

            {/* ── Bundle Deals ── */}
            <section id="bundles" className="section-container bundles-section">
                <h2 className="section-title">Bundle Deals</h2>
                <p className="section-subtitle">10 meals, fully customizable — pick your proteins, carbs, and veggies.</p>
                <div className="bundles-grid">
                    <BundleDeal variant="standard" />
                    <BundleDeal variant="premium" />
                </div>
            </section>

            {/* ── Faith quote ── */}
            <section className="section-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <BibleQuote
                    verse="Dear friend, I pray that you may enjoy good health and that all may go well with you, even as your soul is getting along well."
                    reference="3 John 1:2"
                    description="Our Prayer For You"
                />
            </section>

            {/* ── How It Works ── */}
            <section className="hiw-section">
                <div className="hiw-inner">
                    <p className="hiw-eyebrow">Simple & Fresh</p>
                    <h2 className="hiw-title">How It Works</h2>

                    <div className="hiw-grid">
                        <div className="hiw-card">
                            <div className="hiw-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 2.76-5 9-5 9s-5-6.24-5-9a5 5 0 0 1 5-5z"></path><circle cx="12" cy="7" r="1.5"></circle><path d="M3 20h18"></path><path d="M5 20l2-4h10l2 4"></path></svg>
                            </div>
                            <span className="hiw-step-label">Step 1</span>
                            <h3>Pick Your Protein</h3>
                            <p>Steak, Chicken, Shrimp, Salmon, Tilapia, Bulgogi, Tri Tip or Ground Beef.</p>
                        </div>

                        <div className="hiw-card">
                            <div className="hiw-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </div>
                            <span className="hiw-step-label">Step 2</span>
                            <h3>Select Your Carbs</h3>
                            <p>Jasmine Rice, Red Potatoes, or Skip for low carb.</p>
                        </div>

                        <div className="hiw-card">
                            <div className="hiw-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                            </div>
                            <span className="hiw-step-label">Step 3</span>
                            <h3>Add Veggies</h3>
                            <p>Fresh Mixed Vegetables or None — your call.</p>
                        </div>

                        <div className="hiw-card">
                            <div className="hiw-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"></rect><path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1"></path><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            </div>
                            <span className="hiw-step-label">Step 4</span>
                            <h3>We Cook & Deliver</h3>
                            <p>Chef-prepared meals delivered right to your door.</p>
                        </div>
                    </div>

                    <div className="hiw-cta">
                        <Button variant="secondary" onClick={() => navigate('/customize')}>Create Your Bowl</Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
