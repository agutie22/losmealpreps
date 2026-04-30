import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import AdminModal from '../../components/admin/AdminModal';
import type { BundleDealRow, BundleProteinMap, IngredientRow } from './types';

type BundlesManagerProps = {
    bundleDeals: BundleDealRow[];
    patchBundle: (variant: BundleDealRow['variant'], patch: Partial<BundleDealRow>) => void;
    bundleProteinMap: BundleProteinMap;
    setBundleProteinMap: Dispatch<SetStateAction<BundleProteinMap>>;
    proteinOptions: IngredientRow[];
    supabase: SupabaseClient;
};

function formatPrice(value: number): string {
    return `$${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;
}

export default function BundlesManager({
    bundleDeals,
    patchBundle,
    bundleProteinMap,
    setBundleProteinMap,
    proteinOptions,
    supabase
}: BundlesManagerProps) {
    const [dealModal, setDealModal] = useState<'standard' | 'premium' | null>(null);
    const [proteinsOpen, setProteinsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const activeBundle = dealModal ? bundleDeals.find((b) => b.variant === dealModal) : undefined;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeBundle) return;

        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `bundle_${activeBundle.variant}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Failed to upload image.');
                return;
            }

            const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName);
            patchBundle(activeBundle.variant, { image: data.publicUrl });
        } catch (err) {
            console.error('Upload failed:', err);
            alert('An error occurred during upload.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <section className="admin-section admin-section--flush admin-bundles-manager admin-panel-dark">
            <div className="admin-section-head admin-section-head--row admin-meals-hero">
                <div>
                    <h2 className="admin-meals-title">Bundle deals</h2>
                    <p className="admin-help admin-meals-help">
                        Customer-facing bundle cards in the flow. Proteins define which options appear for each tier in the
                        customizer.
                    </p>
                </div>
            </div>
            <ul className="admin-modal-list">
                {bundleDeals.map((bundle) => (
                    <li key={bundle.variant}>
                        <button
                            type="button"
                            className="admin-list-row"
                            onClick={() => setDealModal(bundle.variant)}
                        >
                            <div className="admin-list-row-main">
                                <span className="admin-list-row-eyebrow">{bundle.variant}</span>
                                <span className="admin-list-row-title">{bundle.title || 'Untitled'}</span>
                                <span className="admin-list-row-meta">
                                    {formatPrice(bundle.price)} · {bundle.meal_count} meals
                                </span>
                            </div>
                            <span className={`admin-row-status ${bundle.is_active ? 'live' : 'draft'}`}>
                                {bundle.is_active ? 'Live' : 'Draft'}
                            </span>
                            <span className="admin-row-chevron" aria-hidden>▸</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="admin-bundles-extras">
                <button type="button" className="admin-btn admin-aux-btn" onClick={() => setProteinsOpen(true)}>
                    Allowed proteins per bundle
                </button>
            </div>

            <AdminModal
                open={!!activeBundle}
                onClose={() => setDealModal(null)}
                title={activeBundle ? `${activeBundle.variant} bundle` : 'Bundle'}
                subtitle="Pricing, copy, and visibility for this variant."
                className="admin-meals-manager"
            >
                {activeBundle && (
                    <div className="admin-bundle-modal-form" onClick={(e) => e.stopPropagation()}>
                        <label className="admin-toggle-row">
                            <input
                                type="checkbox"
                                checked={activeBundle.is_active}
                                onChange={(e) => patchBundle(activeBundle.variant, { is_active: e.target.checked })}
                            />
                            <span>Visible on site</span>
                        </label>
                        <div className="admin-form-grid admin-form-grid--bundle">
                            <div className="admin-field">
                                <label className="admin-field-label">Title</label>
                                <input
                                    className="admin-input admin-meals-input"
                                    value={activeBundle.title}
                                    onChange={(e) => patchBundle(activeBundle.variant, { title: e.target.value })}
                                />
                            </div>
                            <div className="admin-field">
                                <label className="admin-field-label">Subtitle</label>
                                <input
                                    className="admin-input admin-meals-input"
                                    value={activeBundle.subtitle}
                                    onChange={(e) => patchBundle(activeBundle.variant, { subtitle: e.target.value })}
                                />
                            </div>
                            <div className="admin-field">
                                <label className="admin-field-label">Price ($)</label>
                                <input
                                    className="admin-input admin-meals-input"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={activeBundle.price}
                                    onChange={(e) => patchBundle(activeBundle.variant, { price: Number(e.target.value) })}
                                />
                            </div>
                            <div className="admin-field">
                                <label className="admin-field-label">Meals in bundle</label>
                                <input
                                    className="admin-input admin-meals-input"
                                    type="number"
                                    min={1}
                                    value={activeBundle.meal_count}
                                    onChange={(e) => patchBundle(activeBundle.variant, { meal_count: Number(e.target.value) })}
                                />
                            </div>
                            <div className="admin-field admin-field--span-2">
                                <label className="admin-field-label">Image</label>
                                <div className="admin-upload-zone admin-upload-zone--inline">
                                    {activeBundle.image && (
                                        <img src={activeBundle.image} alt="" className="admin-upload-preview admin-upload-preview--small" />
                                    )}
                                    <button
                                        type="button"
                                        className="admin-btn secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>

            <AdminModal
                open={proteinsOpen}
                onClose={() => setProteinsOpen(false)}
                title="Allowed proteins"
                subtitle="Which protein ingredients can customers pick for each bundle tier."
                size="wide"
                className="admin-meals-manager"
            >
                {(['standard', 'premium'] as const).map((variant) => (
                    <div key={variant} className="admin-mapping-block admin-mapping-block--modal">
                        <strong className="admin-mapping-heading">{variant}</strong>
                        <div className="admin-chip-list">
                            {proteinOptions.length === 0 && (
                                <p className="admin-empty-hint">Add protein items on the Nutrition Data tab first.</p>
                            )}
                            {proteinOptions.map((protein) => {
                                const checked = bundleProteinMap[variant].includes(protein.id);
                                return (
                                    <label key={`${variant}-${protein.id}`} className="admin-chip">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                setBundleProteinMap((prev) => {
                                                    const current = prev[variant];
                                                    const next = e.target.checked
                                                        ? [...current, protein.id]
                                                        : current.filter((id) => id !== protein.id);
                                                    return { ...prev, [variant]: next };
                                                });
                                            }}
                                        />
                                        {protein.name}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </AdminModal>
        </section>
    );
}
