import React, { useMemo } from 'react';
import { ShieldCheck, Tag } from 'lucide-react';
import { useFood } from './FoodContext';

export const OrderSummary: React.FC = React.memo(() => {
  const { cart, activeCoupon } = useFood();

  const summary = useMemo(() => {
    let itemsTotal = 0;
    let deliveryFeeTotal = 0;
    let savingsFromDeals = 0;

    cart.foodItems.forEach(line => {
      const { quantity, item } = line;
      itemsTotal += item.price * quantity;
      deliveryFeeTotal += item.deliveryFee * quantity;
      savingsFromDeals += item.discount * quantity;
    });

    // Calculate coupon discounts
    let couponSavings = 0;
    if (activeCoupon) {
      if (activeCoupon.discount <= 100) {
        // Flat off
        couponSavings = activeCoupon.discount;
      } else {
        // Percentage or capping
        couponSavings = Math.min(itemsTotal * 0.2, activeCoupon.discount);
      }
    }

    const taxes = Math.round(itemsTotal * 0.05); // 5% GST
    const platformFee = cart.foodItems.length > 0 ? 5 : 0; // 5 rupees platform fee
    const grandTotal = Math.max(0, itemsTotal + deliveryFeeTotal + taxes + platformFee - savingsFromDeals - couponSavings);

    return {
      itemsTotal,
      deliveryFeeTotal,
      savingsFromDeals,
      couponSavings,
      taxes,
      platformFee,
      grandTotal
    };
  }, [cart.foodItems, activeCoupon]);

  if (cart.foodItems.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs font-semibold font-sans">
        Your food checklist is empty.
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Payment Summary</span>
        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Safe checkout
        </span>
      </div>

      <div className="space-y-2 text-xs font-medium text-slate-600 font-sans">
        <div className="flex justify-between">
          <span>Items reference price ({cart.foodItems.reduce((acc, x) => acc + x.quantity, 0)} items)</span>
          <span className="font-mono">₹{summary.itemsTotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Real-time delivery fees</span>
          <span className="font-mono text-slate-800">₹{summary.deliveryFeeTotal}</span>
        </div>
        <div className="flex justify-between text-emerald-600 font-bold">
          <span>Platform discounts & deals</span>
          <span className="font-mono">-₹{summary.savingsFromDeals}</span>
        </div>

        {summary.couponSavings > 0 && (
          <div className="flex justify-between text-rose-600 font-bold items-center">
            <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> Coupon Applied ({activeCoupon.code})</span>
            <span className="font-mono">-₹{summary.couponSavings}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>GST Taxes (5%)</span>
          <span className="font-mono">₹{summary.taxes}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform comparison charge</span>
          <span className="font-mono">₹{summary.platformFee}</span>
        </div>

        <div className="flex justify-between text-sm font-black text-slate-900 border-t border-dashed border-slate-200 pt-2 font-mono">
          <span>Estimated Grand Total</span>
          <span className="text-rose-600">₹{summary.grandTotal}</span>
        </div>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';
