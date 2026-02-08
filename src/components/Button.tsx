import { type ButtonHTMLAttributes, forwardRef } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`btn btn-${variant} btn-${size} ${className}`}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';

export default Button;
