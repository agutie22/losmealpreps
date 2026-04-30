import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="global-footer">
            <div className="footer-top">
                <div className="footer-brand">
                    <img src="/logo-transparent.png" alt="Los Meal Preps" className="footer-logo" />
                    <p className="footer-tagline">Fuel Your Ambition.</p>
                </div>

                <div className="footer-faith">
                    <p className="footer-verse">
                        "So whether you eat or drink or whatever you do, do it all for the glory of God."
                    </p>
                    <p className="footer-verse-ref">— 1 Corinthians 10:31</p>
                </div>

                <div className="footer-links">
                    <a href="https://instagram.com/losmealpreps" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="mailto:info@losmealpreps.com">Contact</a>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-copyright">
                    &copy; {new Date().getFullYear()} Los Meal Preps. All rights reserved.
                </div>
                <div className="footer-scripture">
                    <p>"Soli Deo Gloria" — To God Alone Be The Glory</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
