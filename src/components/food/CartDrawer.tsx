import React, { useMemo, useCallback } from 'react';
import { ShoppingCart, X, Plus, Minus, CreditCard, Sparkles, Smile } from 'lucide-react';
import { useFood } from './FoodContext';
import { CouponSection } from './CouponSection';
import { OrderSummary } from './OrderSummary';

export const CartDrawer: React.FC = React.memo(() => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    addToCart, 
    removeFromCart, 
    activeCoupon 
  } = useFood();

  const cartItemsCount = useMemo(() => {
    return cart.foodItems.reduce((acc, line) => acc + line.quantity, 0);
  }, [cart.foodItems]);

  const cartTotal = useMemo(() => {
    return cart.foodItems.reduce((acc, line) => acc + (line.item.price * line.quantity), 0);
  }, [cart.foodItems]);

  const handleCheckout = useCallback(() => {
    alert(`🎉 Order Placed Successfully! Your food comparison order totaling ₹${cartTotal} has been sent to our dispatchers via the optimal low-rate sandbox platform!`);
    setIsCartOpen(false);
  }, [cartTotal, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-100 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
              <ShoppingCart className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display">Guaranteed Checkout</h3>
              <p className="text-[10px] text-slate-500 font-medium">Comparing delivery platforms in real time</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-none">
          {cart.foodItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-sans space-y-2">
              <Smile className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold">Your checkout checklist is empty.</p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-100 transition"
              >
                Start Adding
              </button>
            </div>
          ) : (
            <>
              {/* Connected platforms prompt */}
              <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-900/30 p-3 rounded-2xl text-white space-y-1.5">
                <span className="text-[8px] font-mono font-black text-emerald-300 uppercase tracking-widest block">🎉 Comparison Optimal Yield</span>
                <p className="text-[10px] leading-relaxed text-emerald-100">
                  By routing items dynamically through Zomato/Swiggy/Zepto Cafe, you are saving up to <strong className="font-extrabold text-white">25%</strong> over standard single-platform rates!
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="block text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider">Checkout Checklist</span>
                <div className="space-y-2.5">
                  {cart.foodItems.map((line) => (
                    <div 
                      key={line.item.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-2xl"
                    >
                      <div className="text-left space-y-1 pr-3 flex-1 min-w-0">
                        <span className="text-xs font-black text-slate-900 block leading-tight truncate">{line.item.name}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[8px] font-black text-white px-1.5 py-0.2 rounded uppercase ${
                            line.item.platform === 'Zomato' ? 'bg-red-500' : line.item.platform === 'Swiggy' ? 'bg-orange-500' : line.item.platform === 'EatSure' ? 'bg-purple-600' : 'bg-emerald-600'
                          }`}>
                            {line.item.platform}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 font-mono">₹{line.item.price} each</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-black text-slate-900 font-mono mr-1">₹{line.item.price * line.quantity}</span>
                        <div className="flex items-center space-x-1 bg-white border border-slate-200 p-0.5 rounded-xl font-mono shrink-0">
                          <button
                            type="button"
                            onClick={() => removeFromCart(line.item)}
                            className="px-2 hover:bg-rose-50 text-rose-600 font-black text-xs transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-black px-1.5 text-rose-600">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(line.item)}
                            className="p-1 px-2 hover:bg-rose-500 hover:text-white text-rose-600 bg-rose-50 rounded-lg transition font-black text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <CouponSection />

              {/* Order Summary */}
              <OrderSummary />
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.foodItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl cursor-pointer shadow-md transition uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Verify and Place Order ➔</span>
            </button>
            <div className="flex items-center justify-center space-x-1.5 text-[9px] text-slate-400 text-center font-medium font-mono uppercase">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Free Delivery automatically locked via connected accounts!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CartDrawer.displayName = 'CartDrawer';
