import React, { useState, useMemo, useCallback } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { useFood } from './FoodContext';

export const CouponSection: React.FC = React.memo(() => {
  const { availableCoupons, activeCoupon, setActiveCoupon, cart } = useFood();
  const [typedCode, setTypedCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cartTotal = useMemo(() => {
    return cart.foodItems.reduce((acc, line) => acc + (line.item.price * line.quantity), 0);
  }, [cart.foodItems]);

  const handleApply = useCallback((coupon: any) => {
    if (cartTotal < coupon.minOrder) {
      setErrorMsg(`Minimum order of ₹${coupon.minOrder} required for ${coupon.code}`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setActiveCoupon(coupon);
    setTypedCode('');
    setErrorMsg('');
  }, [cartTotal, setActiveCoupon]);

  const handleApplyTyped = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCode.trim()) return;

    const matched = availableCoupons.find(
      c => c.code.toLowerCase() === typedCode.trim().toLowerCase()
    );

    if (matched) {
      handleApply(matched);
    } else {
      setErrorMsg('Invalid coupon code!');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  }, [typedCode, availableCoupons, handleApply]);

  const handleRemove = useCallback(() => {
    setActiveCoupon(null);
  }, [setActiveCoupon]);

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-150 space-y-3 font-sans">
      <div className="flex items-center space-x-1.5 text-slate-800">
        <Tag className="w-4 h-4 text-rose-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Promotional Coupons</span>
      </div>

      {/* Coupon Form */}
      <form onSubmit={handleApplyTyped} className="flex space-x-2">
        <input
          type="text"
          value={typedCode}
          onChange={(e) => setTypedCode(e.target.value)}
          placeholder="ENTER COUPON CODE"
          className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-rose-400 font-mono uppercase font-bold"
        />
        <button
          type="submit"
          className="bg-slate-900 hover:bg-rose-900 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl cursor-pointer transition-colors font-mono uppercase"
        >
          Apply
        </button>
      </form>

      {errorMsg && (
        <p className="text-[10px] text-red-500 font-bold font-mono animate-pulse">{errorMsg}</p>
      )}

      {/* Applied Coupon Info */}
      {activeCoupon && (
        <div className="flex items-center justify-between bg-rose-50/70 border border-rose-100 p-2.5 rounded-xl text-rose-900 text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Applied <strong className="font-bold text-rose-950 font-mono">{activeCoupon.code}</strong> (Saved ₹{activeCoupon.discount})
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-md cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Coupons List */}
      <div className="space-y-2 pt-1 max-h-36 overflow-y-auto scrollbar-none">
        {availableCoupons.map((coupon) => {
          const isApplied = activeCoupon?.code === coupon.code;
          const isEligible = cartTotal >= coupon.minOrder;
          
          return (
            <div
              key={coupon.code}
              onClick={() => !isApplied && handleApply(coupon)}
              className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isApplied
                  ? 'border-rose-450 bg-rose-50/30'
                  : isEligible
                  ? 'border-slate-150 hover:border-slate-250 bg-white'
                  : 'border-slate-150 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-black text-slate-800 font-mono block tracking-tight uppercase">
                  🎟️ {coupon.code}
                </span>
                <span className="text-[9.5px] text-slate-400 block font-medium leading-normal">
                  {coupon.description}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-rose-600 block font-mono">
                  -₹{coupon.discount}
                </span>
                <span className="text-[8px] text-slate-400 block font-mono">
                  Min order ₹{coupon.minOrder}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CouponSection.displayName = 'CouponSection';
