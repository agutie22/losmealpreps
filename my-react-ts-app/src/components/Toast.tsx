import React, { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Disappear after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="toast-notification">
            <div className="toast-content">
                <span className="toast-icon">✅</span>
                <span className="toast-message">{message}</span>
            </div>
        </div>
    );
};

export default Toast;
