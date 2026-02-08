import React, { useEffect, useState } from 'react';
import './InstructionModal.css';

interface InstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const InstructionModal: React.FC<InstructionModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(3);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(3);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onComplete]);

    if (!isOpen) return null;

    return (
        <div className="instruction-modal-overlay">
            <div className="instruction-modal-content">
                <div className="modal-icon">
                    ✅
                </div>
                <h2>Order Copied!</h2>

                <div className="instruction-steps">
                    <p>Redirecting to Instagram in <b>{timeLeft}</b> seconds...</p>
                    <p className="sub-text">Paste your order in the chat to complete.</p>
                </div>

                <div className="modal-actions">
                    <button onClick={onComplete} className="modal-btn primary">
                        Open Instagram Now
                    </button>
                    <button onClick={onClose} className="modal-btn secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionModal;
