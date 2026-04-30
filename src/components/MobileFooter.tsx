import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './MobileFooter.css';

const MobileFooter: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems } = useCart();

    const isActive = (path: string) => location.pathname === path;

    const handleBundlesClick = () => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollToBundles: true } });
        } else {
            document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="mobile-footer">
            <div className="mobile-nav-items">
                <button
                    className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
                    onClick={() => navigate('/')}
                >
                    <span className="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </span>
                    <span className="nav-label">Home</span>
                </button>

                <button
                    className="mobile-nav-item"
                    onClick={handleBundlesClick}
                >
                    <span className="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </span>
                    <span className="nav-label">Bundles</span>
                </button>
                <button
                    className={`mobile-nav-item ${isActive('/consultation') ? 'active' : ''}`}
                    onClick={() => navigate('/consultation')}
                >
                    <span className="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </span>
                    <span className="nav-label">Consult</span>
                </button>
                <button
                    className={`mobile-nav-item cart-mobile-btn ${isActive('/plan') ? 'active' : ''}`}
                    onClick={() => navigate('/plan')}
                >
                    <span className="nav-icon cart-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        {totalItems > 0 && (
                            <span className="mobile-cart-badge">{totalItems}</span>
                        )}
                    </span>
                    <span className="nav-label">My Order</span>
                </button>
            </div>
        </div>
    );
};

export default MobileFooter;
