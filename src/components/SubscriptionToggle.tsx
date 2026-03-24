import React from 'react';
import { useUser } from '../context/UserContext';
import './SubscriptionToggle.css';

const SubscriptionToggle: React.FC = () => {
    const { isSubscriber, toggleSubscription } = useUser();

    return (
        <div className="subscription-toggle-container">
            <div className="toggle-wrapper" onClick={toggleSubscription}>
                <div className={`toggle-option ${isSubscriber ? 'active' : ''}`}>
                    <span className="option-label">Weekly Subscription</span>
                    <span className="option-badge">SAVE 15%</span>
                </div>
                <div className={`toggle-option ${!isSubscriber ? 'active' : ''}`}>
                    <span className="option-label">One-time Purchase</span>
                </div>
                <div className={`toggle-slider ${isSubscriber ? 'left' : 'right'}`}></div>
            </div>
            <p className="toggle-hint">
                {isSubscriber 
                    ? "Best value! Flexible weekly delivery, pause or cancel anytime." 
                    : "No commitment. Standard pricing applies to all meals."}
            </p>
        </div>
    );
};

export default SubscriptionToggle;
