import React from 'react';
import './InstructionModal.css';

interface InstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const InstructionModal: React.FC<InstructionModalProps> = ({ isOpen, onClose, onComplete }) => {
    if (!isOpen) return null;

    return (
        <div className="instruction-modal-overlay">
            <div className="instruction-modal-content">
                <div className="modal-icon">✅</div>
                <h2>Order Copied!</h2>

                <div className="instruction-steps">
                    <div className="step-row"><b>①</b> Your order text is copied to clipboard</div>
                    <div className="step-row"><b>②</b> Open Instagram and go to <b>@losmealpreps</b></div>
                    <div className="step-row"><b>③</b> Paste your order in the DM and send</div>
                </div>

                <div className="modal-actions">
                    <button onClick={onComplete} className="modal-btn primary">
                        Open @losmealpreps DM →
                    </button>
                    <button onClick={onClose} className="modal-btn secondary">
                        I'll do it later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstructionModal;
