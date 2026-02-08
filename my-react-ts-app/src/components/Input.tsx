import { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="input-field">
                {label && <label className="input-label">{label}</label>}
                <input
                    ref={ref}
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="input-error-message">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
