import type { Meal } from '@/lib/queries/meals';
import { formatPrice } from '@/lib/pricing';
import { useCartStore } from '@/stores/cartStore';

interface Props {
  meal: Meal;
}

export default function AddMealButton({ meal }: Props) {
  const addMealItem = useCartStore((state) => state.addMealItem);
  const itemCount = useCartStore((state) => state.items.length);

  const handleAdd = () => {
    addMealItem(meal);
    window.dispatchEvent(new CustomEvent('cart:open:request'));
  };

  const buttonCls =
    'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] rounded-[var(--radius-pill)] text-[15px] font-semibold hover:bg-[var(--color-brand-hover)] active:scale-[0.98] transition-all shadow-[var(--shadow-rail)]';

  const stickyBottom = itemCount > 0
    ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(2.5rem + env(safe-area-inset-bottom, 0px))';

  return (
    <>
      <div className="hidden sm:block pb-6 md:pb-10">
        <button
          type="button"
          onClick={handleAdd}
          className={`${buttonCls} w-auto min-w-[200px] py-3 px-8 shadow-none`}
        >
          Add to Order
        </button>
      </div>

      <div
        className="sm:hidden sticky left-0 right-0 z-40 -mx-5 flex flex-col items-center gap-2 px-5 pt-10 pb-6 pointer-events-none"
        style={{ bottom: stickyBottom }}
      >
        <button
          type="button"
          onClick={handleAdd}
          className={`${buttonCls} pointer-events-auto min-h-[48px] py-3 px-6`}
        >
          Add to Order · {formatPrice(meal.base_price_cents)}
        </button>
      </div>
    </>
  );
}
