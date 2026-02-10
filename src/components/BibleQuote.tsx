import React from 'react';
import './BibleQuote.css';

interface BibleQuoteProps {
    verse: string;
    reference: string;
    description?: string; // Optional context like "Our Mission"
    className?: string;
    light?: boolean; // If true, optimizes for dark backgrounds
}

const BibleQuote: React.FC<BibleQuoteProps> = ({
    verse,
    reference,
    description,
    className = '',
    light = false
}) => {
    return (
        <div className={`bible-quote-container ${light ? 'light-theme' : ''} ${className}`}>
            {description && <div className="quote-description">{description}</div>}
            <blockquote className="bible-quote-text">
                "{verse}"
            </blockquote>
            <cite className="bible-quote-reference">— {reference}</cite>
        </div>
    );
};

export default BibleQuote;
