import React, { useState } from 'react';
import { UnifiedCart, FoodItem, MartItem, OrderActivity } from '../types';
import { ShoppingCart, CreditCard, ChevronRight, Coins, ShieldCheck, HelpCircle, Ticket, AlertCircle, Sparkles } from 'lucide-react';

interface CartCheckoutProps {
  cart: UnifiedCart;
  clearCart: () => void;
  walletBalance: number;
  deductWalletCoins: (rs: number) => void;
  addOrderToActivity: (order: OrderActivity) => void;
  tabSwitch: (tab: string) => void;
}

export default function CartCheckout({
  cart,
  clearCart,
  walletBalance,
  deductWalletCoins,
  addOrderToActivity,
  tabSwitch
}: CartCheckoutProps) {
  const [paymentOption, setPaymentOption] = useState<'upi' | 'card' | 'wallet' | 'later'>('upi');
  const [useWalletPromoDiscount, setUseWalletPromoDiscount] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [discountAppliedAmt, setDiscountAppliedAmt] = useState(0);

  const hasFood = cart.foodItems.length > 0;
  const hasMart = cart.martItems.length > 0;
  const hasStay = !!cart.stayBooking;

  if (!hasFood && !hasMart && !hasStay) {
    return (
      <div className="p-12 text-center bg-gray-50/55 rounded-3xl border border-dashed border-gray-250 font-sans max-w-sm mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-xs">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-gray-950 font-display">Your Super Cart is empty</h3>
          <p className="text-xs text-gray-500 max-w-xs leading-normal mx-auto">
            Add hot foods, lightning groceries, or boutique beach stays to check them out together on one screen!
          </p>
        </div>
        <button
          type="button"
          onClick={() => tabSwitch('home')}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-xs cursor-pointer"
        >
          Browse Best Deals
        </button>
      </div>
    );
  }

  // Calculate Aggregated Prices
  let totalFoodPrice = 0;
  let totalFoodCount = 0;
  cart.foodItems.forEach(item => {
    const netPrice = item.item.price + item.item.deliveryFee - item.item.discount;
    totalFoodPrice += netPrice * item.quantity;
    totalFoodCount += item.quantity;
  });

  let totalMartPrice = 0;
  let totalMartCount = 0;
  cart.martItems.forEach(entry => {
    const quote = entry.item.prices.find(p => p.platform === entry.platform);
    if (quote) {
      totalMartPrice += (quote.discountedPrice) * entry.quantity;
    }
    totalMartCount += entry.quantity;
  });

  let totalStayPrice = 0;
  if (cart.stayBooking) {
    const quote = cart.stayBooking.hotel.comparisons.find(p => p.platform === cart.stayBooking!.platform);
    if (quote) {
      totalStayPrice = (quote.pricePerNight * cart.stayBooking.totalNights) + quote.taxes;
    }
  }

  const subTotalBill = totalFoodPrice + totalMartPrice + totalStayPrice;
  const deliveryFulfillFee = hasMart ? 15 : 0;
  const platformAdminFee = 4;
  
  // Redeemable Wallet Promo Cap: Max 10% of order or current balance, whichever is lower
  const walletRedeemCap = Math.min(Math.floor(subTotalBill * 0.1), Math.floor(walletBalance));
  const finalDiscount = useWalletPromoDiscount ? walletRedeemCap : discountAppliedAmt;
  const totalAmountToSettle = subTotalBill + deliveryFulfillFee + platformAdminFee - finalDiscount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCodeInput.toUpperCase() === 'CHALOSAVE') {
      setDiscountAppliedAmt(50);
      alert("🎉 Coupon CHALOSAVE applied successfully! Flat ₹50 Cash discount loaded.");
    } else {
      alert("❌ Invalid promo coupon code! Try using 'CHALOSAVE'.");
    }
    setPromoCodeInput('');
  };

  const handleProcessCheckout = () => {
    // Settle points / wallet debits
    if (useWalletPromoDiscount) {
      deductWalletCoins(walletRedeemCap);
    }
    if (paymentOption === 'wallet') {
      if (walletBalance < totalAmountToSettle) {
        alert("❌ Your Chalo Wallet balance is insufficient to clear the full bill! Convert points to wallet cash or select UPI method.");
        return;
      }
      deductWalletCoins(totalAmountToSettle);
    }

    // Populate order list log activities
    if (hasFood) {
      addOrderToActivity({
        id: "CHALO-FOOD-" + Math.floor(100000 + Math.random() * 900000),
        category: 'food',
        platform: cart.foodItems[0].item.platform,
        merchant: cart.foodItems[0].item.restaurant,
        title: `${cart.foodItems[0].item.name} (${totalFoodCount} dishes)`,
        subtitle: `Dispatched & preparing at ${cart.foodItems[0].item.restaurant}`,
        date: "Today",
        time: "Preparing",
        amount: totalFoodPrice,
        status: 'active',
        statusLabel: 'Preparing',
        paymentMethod: paymentOption === 'wallet' ? 'Chalo Wallet' : 'Unified UPI Split'
      });
    }

    if (hasMart) {
      addOrderToActivity({
        id: "CHALO-MART-" + Math.floor(100000 + Math.random() * 900000),
        category: 'mart',
        platform: cart.martItems[0].platform,
        merchant: "Chalo Mart",
        title: `${cart.martItems[0].item.name} + ${totalMartCount - 1} items`,
        subtitle: `Assigned picker. Delivers in ${cart.martItems[0].item.prices[0].deliveryTime} mins`,
        date: "Today",
        time: "Out for delivery",
        amount: totalMartPrice,
        status: 'active',
        statusLabel: 'Assigned Picker',
        paymentMethod: paymentOption === 'wallet' ? 'Chalo Wallet' : 'UPI Instant'
      });
    }

    if (hasStay) {
      addOrderToActivity({
        id: "CHALO-STAY-" + Math.floor(100000 + Math.random() * 900000),
        category: 'stays',
        platform: cart.stayBooking!.platform,
        merchant: cart.stayBooking!.hotel.name,
        title: `Stay Package: ${cart.stayBooking!.hotel.name}`,
        subtitle: `${cart.stayBooking!.totalNights} Nights • ${cart.stayBooking!.query.guests} Guests`,
        date: "Confirmed",
        time: cart.stayBooking!.query.checkIn,
        amount: totalStayPrice,
        status: 'upcoming',
        statusLabel: 'Reservation Confirmed',
        paymentMethod: paymentOption === 'wallet' ? 'Chalo Wallet' : 'Card Payment Split'
      });
    }

    // Success dispatch
    alert(`🎉 Success! Platform split billing completed successfully.\n- Total settled: ₹${totalAmountToSettle.toFixed(0)}\n- Settle Method: ${paymentOption.toUpperCase()}\n- Settlement Hub: Orders dispatched to ${[hasFood && 'Zomato/Swiggy', hasMart && 'Blinkit/Zepto', hasStay && 'Agoda/MMT'].filter(Boolean).join(', ')}.\n\nTrack order lifecycles in the 'Activity' tab!`);
    
    clearCart();
    tabSwitch('activity');
  };

  return (
    <div id="checkout_page_module" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-gray-900">Unified Super Checkout</h2>
          <p className="text-xs text-gray-500">Intelligent split settlement: clear your cart across 3 industries with 1 button</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left: Summary Cart Items detail */}
        <div className="space-y-3">
          
          {/* FOOD CART BLOCK */}
          {hasFood && (
            <div className="bg-rose-50/40 p-3.5 rounded-2xl border border-rose-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">🍔 Food items settled by platform</span>
              <div className="space-y-1.5 divide-y divide-rose-100/50">
                {cart.foodItems.map(({ item, quantity }) => (
                  <div key={`${item.id}-${item.platform}`} className="pt-2 flex justify-between items-center text-xs first:pt-0">
                    <div>
                      <span className="font-bold text-gray-900 block">{item.name}</span>
                      <span className="text-[10px] text-gray-400">{item.restaurant} ({item.platform}) x {quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-800">₹{(item.price + item.deliveryFee - item.discount) * quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MART CART BLOCK */}
          {hasMart && (
            <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">🛒 Mart items settled by platform</span>
              <div className="space-y-1.5 divide-y divide-emerald-100/50">
                {cart.martItems.map(({ item, platform, quantity }) => {
                  const quote = item.prices.find(p => p.platform === platform);
                  return (
                    <div key={`${item.id}-${platform}`} className="pt-2 flex justify-between items-center text-xs first:pt-0">
                      <div>
                        <span className="font-bold text-gray-900 block">{item.name}</span>
                        <span className="text-[10px] text-gray-400">{item.brand} ({platform}) x {quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-800">₹{quote ? quote.discountedPrice * quantity : 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAY BOOKING BLOCK */}
          {hasStay && (
            <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">🏨 lodging stays booked</span>
              <div className="flex justify-between items-start text-xs pt-1">
                <div>
                  <span className="font-bold text-gray-900 block">{cart.stayBooking!.hotel.name}</span>
                  <span className="text-[10px] text-indigo-700 font-bold block">{cart.stayBooking!.platform} Booking • {cart.stayBooking!.totalNights} night(s)</span>
                  <span className="text-[10px] text-gray-450 block font-medium">Guests: {cart.stayBooking!.query.guests} • Rooms: {cart.stayBooking!.query.rooms}</span>
                </div>
                <span className="font-mono font-bold text-gray-800">₹{totalStayPrice}</span>
              </div>
            </div>
          )}

          {/* Apply coupon promo form */}
          <div className="bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
            <form onSubmit={handleApplyPromo} className="flex gap-1.5">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Promo Code (use CHALOSAVE)"
                id="apply_promo_input"
                className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs font-bold outline-none uppercase"
              />
              <button
                type="submit"
                id="promo_apply_submit_btn"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-4 rounded-xl text-xs cursor-pointer transition"
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        {/* Right: Payment split and Settle transaction */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex flex-col justify-between space-y-4">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pb-1 border-b border-gray-100">Bill Breakdown & Toll Charges</span>
            
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-gray-600">
                <span>Sum of aggregator items</span>
                <span>₹{subTotalBill}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery fees factor</span>
                <span>₹{deliveryFulfillFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform split toll charge</span>
                <span>₹{platformAdminFee}</span>
              </div>
              
              {/* Wallet/promo discount indicators */}
              {finalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coins/Promo Discount</span>
                  <span>-₹{finalDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-gray-950 pt-2 border-t border-dashed border-gray-150">
                <span>Total Settle Rate</span>
                <span>₹{totalAmountToSettle.toFixed(0)}</span>
              </div>
            </div>

            {/* Chalo Wallet Coins Auto-Apply toggle */}
            {walletBalance > 0 && (
              <button
                type="button"
                onClick={() => setUseWalletPromoDiscount(!useWalletPromoDiscount)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                  useWalletPromoDiscount ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Redeem Chalo coins? (Balance: ₹{walletBalance.toFixed(0)})</span>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-700">
                  {useWalletPromoDiscount ? `-₹${walletRedeemCap}` : `Save up to ₹${walletRedeemCap}`}
                </span>
              </button>
            )}

            {/* Methods select options */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block font-mono pl-0.5">Choose Payment Gateway Hub</span>
              
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {(['upi', 'card', 'wallet', 'later'] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPaymentOption(option)}
                    className={`p-2 rounded-xl text-[10px] font-bold border flex flex-col items-center justify-center space-y-1 transition text-center cursor-pointer ${
                      paymentOption === option
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-extrabold'
                        : 'border-gray-150 hover:bg-slate-50 text-gray-600'
                    }`}
                  >
                    <span>
                      {option === 'upi' && '📱 UNIFIED UPI'}
                      {option === 'card' && '💳 CREDIT CARD'}
                      {option === 'wallet' && '🪙 CHALO WALLET'}
                      {option === 'later' && '🗓️ PAY LATER'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              id="confirm_unified_checkout_btn"
              onClick={handleProcessCheckout}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-extrabold py-3 rounded-2xl shadow-md cursor-pointer text-xs flex items-center justify-center space-x-1.5 uppercase transition"
            >
              <Sparkles className="w-4 h-4 text-amber-100" />
              <span>Settle & Finalize Super Checkout Bill</span>
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Merchant Split Settle protocols verified and secured.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
