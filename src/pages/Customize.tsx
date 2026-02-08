import { Link } from 'react-router-dom';
import MealBuilder from '../components/MealBuilder';
import './Customize.css';

const Customize = () => {
    return (
        <div className="customize-page page-container">
            <MealBuilder />

            <div className="consultation-cta-section" style={{
                marginTop: '4rem',
                padding: '3rem',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(30,41,59,0.5) 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Need a Personalized Plan?</h2>
                <p style={{ maxWidth: '600px', margin: '0 auto 2rem auto', color: 'var(--color-text-muted)' }}>
                    Not sure which macros are right for you? Our nutritionists can build a custom plan tailored to your body type and goals.
                </p>
                <Link to="/consultation" className="btn btn-primary btn-lg">
                    Request Free Consultation
                </Link>
            </div>
        </div>
    );
};

export default Customize;
