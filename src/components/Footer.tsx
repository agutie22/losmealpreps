import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="global-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <img src="/logo-transparent.png" alt="Los Meal Preps" className="footer-logo" />
                    <p className="footer-tagline">Fuel Your Ambition.</p>
                </div>
                <div className="footer-links">
                    <a href="https://instagram.com/losmealpreps" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="mailto:info@losmealpreps.com">Contact</a>
                </div>
            </div>
            <div className="footer-scripture">
                <p>"Soli Deo Gloria" — To God Alone Be The Glory</p>
                {/* Optional: <p>Matthew 6:11</p> */}
            </div>
            <div className="footer-copyright">
                &copy; {new Date().getFullYear()} Los Meal Preps. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
