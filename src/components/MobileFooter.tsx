import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileFooter.css';

const MobileFooter: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="mobile-footer">
            <div className="mobile-nav-items">
                <button
                    className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
                    onClick={() => navigate('/')}
                >
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">Home</span>
                </button>
                <button
                    className={`mobile-nav-item ${isActive('/customize') ? 'active' : ''}`}
                    onClick={() => navigate('/customize')}
                >
                    <span className="nav-icon">🥣</span>
                    <span className="nav-label">Customize</span>
                </button>
                <button
                    className={`mobile-nav-item ${isActive('/plan') ? 'active' : ''}`}
                    onClick={() => navigate('/plan')}
                >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">Plan</span>
                </button>
            </div>
        </div>
    );
};

export default MobileFooter;
