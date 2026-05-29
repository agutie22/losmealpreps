import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/pricing';
import { formatFullOrder } from '@/lib/format-order';
import { repriceCartItems } from '@/lib/reprice-cart';
import { parseSauceConfig, calculateCartTotals } from '@/lib/cart-math';
import CartAddonsUpsell from './CartAddonsUpsell';

interface Props {
  igHandle: string;
  saucePricingConfigRaw?: string | null;
}

interface ToastState {
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'error';
}

async function copyOrderText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand for stricter mobile browsers.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function CartWidget({ igHandle, saucePricingConfigRaw }: Props) {
  const { items, removeItem, clearItems, replaceItems } = useCartStore();
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [allowMobileStickyBar, setAllowMobileStickyBar] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const sauceConfig = useMemo(() => parseSauceConfig(saucePricingConfigRaw), [saucePricingConfigRaw]);

  const { totalCents, discountCents, subtotalCents, eligibleSpendCents } = useMemo(
    () => calculateCartTotals(items, sauceConfig),
    [items, sauceConfig]
  );

  const itemCount = items.length;

  useEffect(() => {
    // Avoid portal usage before mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const path = window.location.pathname;
    setAllowMobileStickyBar(path !== '/build' && path !== '/admin' && path !== '/customize');
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const closeForMenuOpen = () => setOpen(false);
    const openCart = () => setOpen(true);
    window.addEventListener('mobile-menu:open', closeForMenuOpen);
    window.addEventListener('cart:open:request', openCart);
    return () => {
      window.removeEventListener('mobile-menu:open', closeForMenuOpen);
      window.removeEventListener('cart:open:request', openCart);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent('cart:open'));
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSendOrder = async () => {
    if (items.length === 0) return;

    const clickStartedAt = Date.now();
    const igUrl = `https://ig.me/m/${igHandle}`;
    // Reserve a tab synchronously during the tap — required on mobile Safari before any await.
    const igWindow = window.open('about:blank', '_blank');
    setRedirecting(true);

    // #region agent log
    fetch('http://127.0.0.1:7685/ingest/33be0550-dd25-4d32-aac7-eb01933db923',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a94fb7'},body:JSON.stringify({sessionId:'a94fb7',runId:'redirect-fix',hypothesisId:'H1-H2',location:'CartWidget.tsx:handleSendOrder:sync-window-open',message:'Reserved Instagram tab on click',data:{igWindowOpened:!!igWindow,igWindowClosed:igWindow?.closed??null,userActivationActive:navigator.userActivation?.isActive,protocol:window.location.protocol,host:window.location.host},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let orderText = formatFullOrder(items, discountCents, totalCents);

    const copied = await copyOrderText(orderText);
    if (!copied) {
      igWindow?.close();
      setRedirecting(false);
      // #region agent log
      fetch('http://127.0.0.1:7685/ingest/33be0550-dd25-4d32-aac7-eb01933db923',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a94fb7'},body:JSON.stringify({sessionId:'a94fb7',runId:'redirect-fix',hypothesisId:'H1-H4',location:'CartWidget.tsx:handleSendOrder:immediate-clipboard-failed',message:'Immediate clipboard copy failed',data:{elapsedMs:Date.now()-clickStartedAt,userActivationActive:navigator.userActivation?.isActive,isSecureContext:window.isSecureContext,hasClipboard:!!navigator.clipboard},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setToast({
        title: 'Clipboard blocked',
        message: 'Could not copy automatically. Please copy your order from the cart and paste it in Instagram.',
        tone: 'error',
      });
      return;
    }

    let priceWasUpdated = false;
    let priceRefreshFailed = false;
    try {
      const repriced = await repriceCartItems(items);
      if (repriced.hadPriceChanges) {
        replaceItems(repriced.items);
        priceWasUpdated = true;
        const updatedTotals = calculateCartTotals(repriced.items, sauceConfig);
        orderText = formatFullOrder(repriced.items, updatedTotals.discountCents, updatedTotals.totalCents);
        await copyOrderText(orderText);
      }
    } catch (repriceError) {
      priceRefreshFailed = true;
      // #region agent log
      fetch('http://127.0.0.1:7685/ingest/33be0550-dd25-4d32-aac7-eb01933db923',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a94fb7'},body:JSON.stringify({sessionId:'a94fb7',runId:'redirect-fix',hypothesisId:'H5',location:'CartWidget.tsx:handleSendOrder:reprice-catch',message:'Reprice failed after clipboard copy',data:{errorName:repriceError instanceof Error?repriceError.name:'unknown',errorMessage:repriceError instanceof Error?repriceError.message:String(repriceError),elapsedMs:Date.now()-clickStartedAt},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    let redirectMethod: 'preopened-tab' | 'window-open' | 'same-tab-fallback' = 'same-tab-fallback';
    if (igWindow && !igWindow.closed) {
      igWindow.location.href = igUrl;
      redirectMethod = 'preopened-tab';
    } else {
      const opened = window.open(igUrl, '_blank');
      if (opened) {
        redirectMethod = 'window-open';
      } else {
        window.location.assign(igUrl);
        redirectMethod = 'same-tab-fallback';
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7685/ingest/33be0550-dd25-4d32-aac7-eb01933db923',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a94fb7'},body:JSON.stringify({sessionId:'a94fb7',runId:'redirect-fix',hypothesisId:'H1-H3',location:'CartWidget.tsx:handleSendOrder:redirect',message:'Instagram redirect attempted',data:{redirectMethod,elapsedMs:Date.now()-clickStartedAt,userActivationActive:navigator.userActivation?.isActive,igUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    setToast({
      title: 'Order copied to clipboard',
      message: priceRefreshFailed
        ? 'Could not refresh latest prices. Copied order uses current cart values. Opening Instagram…'
        : priceWasUpdated
          ? 'Latest prices were applied. Opening Instagram — paste your order in the DM and send.'
          : 'Opening Instagram — paste your order in the DM and send.',
      tone: priceRefreshFailed ? 'warning' : 'success',
    });
    clearItems();
    setOpen(false);
    setRedirecting(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--color-surface-sunken)] text-[var(--color-brand)] hover:bg-[var(--color-surface-sunken)] transition-colors"
        aria-expanded={open}
        aria-controls="cart-drawer"
        aria-label="Open cart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2h3l2.6 12.3a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L22 6H6" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--color-brand)] text-white text-[11px] font-bold flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {isMounted && !open && itemCount > 0 && allowMobileStickyBar && createPortal(
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="sm:hidden fixed left-4 right-4 z-[110] rounded-[var(--radius-pill)] bg-[var(--color-brand)] text-white shadow-[var(--shadow-rail)] px-4 py-3 flex items-center justify-between"
          style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          aria-label="View cart"
        >
          <span className="text-[13px] font-semibold">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
          <span className="text-[14px] font-semibold">View Cart · {formatPrice(totalCents)}</span>
        </button>,
        document.body,
      )}

      {isMounted && open && createPortal(
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/35"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <aside
            id="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="absolute right-0 top-0 h-dvh w-full sm:max-w-[420px] bg-[var(--color-surface-base)] border-l border-[var(--color-surface-sunken)] shadow-[var(--shadow-rail)] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-[var(--color-surface-sunken)] flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-fg)]">
                Your Cart
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-fg)] transition-colors"
                aria-label="Close cart"
              >
                X
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-[14px] text-[var(--color-fg-muted)]">Your cart is empty.</p>
              ) : (
                items.map((item) => (
                  <div key={item.cartId} className="border border-[var(--color-surface-sunken)] rounded-[var(--radius-card)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.kind === 'meal' ? (
                          <>
                            <p className="text-[14px] font-semibold text-[var(--color-fg)] break-words">{item.meal.name}</p>
                            <p className="text-[12px] text-[var(--color-fg-muted)]">Signature meal</p>
                            <p className="text-[12px] text-[var(--color-brand)] mt-1">
                              {formatPrice(item.meal.base_price_cents)}
                            </p>
                          </>
                        ) : item.kind === 'bundle' ? (
                          <>
                            <p className="text-[14px] font-semibold text-[var(--color-fg)] break-words">{item.bundle.bundleName}</p>
                            <p className="text-[12px] text-[var(--color-fg-muted)]">
                              Bundle · {item.bundle.slotCount} meals · {item.bundle.proteinSizeLabel} protein
                            </p>
                            <p className="text-[12px] text-[var(--color-fg-muted)] mt-1 break-words">
                              {Object.entries(
                                item.bundle.mealNames.reduce((acc, name) => {
                                  acc[name] = (acc[name] ?? 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>),
                              ).map(([name, count], idx) => (
                                <React.Fragment key={`${item.cartId}-${name}`}>
                                  {idx > 0 ? ' · ' : ''}
                                  {count}x {name}
                                </React.Fragment>
                              ))}
                            </p>
                            <p className="text-[12px] text-[var(--color-brand)] mt-1">
                              {formatPrice(item.bundle.totalCents)}
                            </p>
                          </>
                        ) : item.kind === 'custom' ? (
                          <>
                            <p className="text-[14px] font-semibold text-[var(--color-fg)] break-words">
                              {item.build.proteinName}{item.build.proteinSize ? ` (${item.build.proteinSize})` : ''}
                            </p>
                            <p className="text-[12px] text-[var(--color-fg-muted)]">Custom meal</p>
                            <p className="text-[12px] text-[var(--color-fg-muted)] mt-1 break-words">
                              {item.build.macros.calories} cal · {item.build.macros.protein_g}g P · {item.build.macros.carbs_g}g C · {item.build.macros.fat_g}g F
                            </p>
                            <p className="text-[12px] text-[var(--color-brand)] mt-1">
                              {formatPrice(item.build.totalCents)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[14px] font-semibold text-[var(--color-fg)] break-words">
                              {item.addon.name}
                            </p>
                            <p className="text-[12px] text-[var(--color-fg-muted)]">Add-on</p>
                            <p className="text-[12px] text-[var(--color-brand)] mt-1">
                              {formatPrice(item.addon.priceCents)}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartId)}
                        className="shrink-0 text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              <CartAddonsUpsell sauceConfig={sauceConfig} />
            </div>

            <div
              className="border-t border-[var(--color-surface-sunken)] px-4 sm:px-5 pt-4 space-y-3 bg-[var(--color-surface-base)]"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[var(--color-fg-muted)]">Subtotal</span>
                <span className="text-[16px] font-medium text-[var(--color-fg)]">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              {discountCents > 0 ? (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-[14px]">Sauce Promo Discount</span>
                  <span className="text-[16px] font-medium">
                    -{formatPrice(discountCents)}
                  </span>
                </div>
              ) : (
                eligibleSpendCents < sauceConfig.free_threshold_cents && sauceConfig.free_threshold_cents > 0 && (
                  <div className="mt-2 p-3 bg-emerald-50 rounded-[var(--radius-base)] border border-emerald-100 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-emerald-800">
                      Add {formatPrice(sauceConfig.free_threshold_cents - eligibleSpendCents)} more to unlock a FREE sauce!
                    </span>
                    <div className="w-16 h-1.5 bg-emerald-200 rounded-full overflow-hidden shrink-0 ml-3">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, (eligibleSpendCents / sauceConfig.free_threshold_cents) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-[var(--color-surface-sunken)]">
                <span className="text-[14px] font-bold text-[var(--color-fg)]">Total</span>
                <span className="text-[24px] font-[family-name:var(--font-display)] font-bold text-[var(--color-brand)]">
                  {formatPrice(totalCents)}
                </span>
              </div>

              <p className="text-[12px] text-[var(--color-fg-muted)]">
                New clients may order a single meal. Returning clients should order at least $60 total or 5 meals.
              </p>

              <button
                type="button"
                onClick={handleSendOrder}
                disabled={items.length === 0 || redirecting}
                className="w-full bg-[var(--color-brand)] disabled:bg-[var(--color-surface-sunken)] disabled:text-[var(--color-fg-subtle)] text-white py-3 rounded-[var(--radius-pill)] text-[14px] font-semibold transition-colors"
              >
                {redirecting ? 'Opening Instagram...' : 'Send Order on Instagram'}
              </button>
              <button
                type="button"
                onClick={clearItems}
                disabled={items.length === 0}
                className="w-full py-2 text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors disabled:opacity-50"
              >
                Clear cart
              </button>
              <p className="text-[11px] text-[var(--color-fg-subtle)] text-center">
                Order is copied to clipboard before Instagram opens.
              </p>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {isMounted && toast && createPortal(
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[390px] z-[140] rounded-[var(--radius-card)] border px-4 py-3 shadow-[var(--shadow-rail)] ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50'
              : toast.tone === 'warning'
                ? 'border-amber-200 bg-amber-50'
                : 'border-rose-200 bg-rose-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                toast.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : toast.tone === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
              }`}
            >
              {toast.tone === 'success' ? '✓' : toast.tone === 'warning' ? '!' : '×'}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--color-fg)]">{toast.title}</p>
              <p className="text-[12px] text-[var(--color-fg-muted)] mt-1 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
