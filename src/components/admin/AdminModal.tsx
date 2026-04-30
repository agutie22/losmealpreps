import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

type AdminModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    /** Wider modal on desktop (e.g. protein picker) */
    size?: 'default' | 'wide' | 'full';
    /** Optional sticky footer (actions) */
    footer?: React.ReactNode;
    /** Extra class on the surface */
    className?: string;
};

/**
 * Full-screen on small viewports, centered card on large. Locks body scroll when open.
 */
export default function AdminModal({
    open,
    onClose,
    title,
    subtitle,
    children,
    size = 'default',
    footer,
    className = ''
}: AdminModalProps) {
    const titleId = useId();
    const surfaceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    const sizeClass = size === 'wide' ? ' admin-modal--wide' : size === 'full' ? ' admin-modal--full' : '';

    return createPortal(
        <div
            className="admin-modal-root"
            role="presentation"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={surfaceRef}
                className={`admin-modal-surface${sizeClass} ${className}`.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="admin-modal-header">
                    <div className="admin-modal-header-text">
                        <h2 className="admin-modal-title" id={titleId}>
                            {title}
                        </h2>
                        {subtitle && <p className="admin-modal-subtitle">{subtitle}</p>}
                    </div>
                    <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </header>
                <div className="admin-modal-body">{children}</div>
                {footer && <footer className="admin-modal-footer">{footer}</footer>}
            </div>
        </div>,
        document.body
    );
}
