import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import type { BundleVariant } from '../types/menu';
import BundleDealCard from './bundle-deal/BundleDealCard';

interface BundleDealProps {
    variant?: BundleVariant;
}

const BundleDeal: React.FC<BundleDealProps> = ({ variant = 'standard' }) => {
    const navigate = useNavigate();
    const { menu } = useMenu();
    const config = menu.bundles[variant];
    if (!config?.isActive) return null;

    const proteins = menu.proteins.filter((p) => config.allowedProteinIds.includes(p.id));

    return (
        <BundleDealCard
            variant={variant}
            config={config}
            proteins={proteins}
            onBuildBundle={(v) => navigate(`/build-bundle?type=${v}`)}
        />
    );
};

export default BundleDeal;
