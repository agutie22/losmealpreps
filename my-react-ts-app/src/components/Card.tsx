import { type HTMLAttributes, forwardRef } from 'react';
import './Card.css';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`card ${className}`}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

export default Card;
