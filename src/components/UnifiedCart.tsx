import React, { useState } from 'react';
import { UnifiedCart as UnifiedCartType, FoodItem, MartItem } from '../types';
import { ShoppingBag, Landmark, ArrowRight, Trash2, CheckCircle2, Ticket, Sparkles, Coins } from 'lucide-react';

interface UnifiedCartProps {
  cart: UnifiedCartType;
  updateFoodQuantity: (item: FoodItem, amt: number) => void;
  updateMartQuantity: (item: MartItem, platform: string, amt: number) => void;
  clearCart: () => void;
  walletBalance: number;
  deductWalletCoins: (amount: number) => void;
  addOrderToActivity: (order: any) => void;
}

export default function UnifiedCart({
  cart,
  updateFoodQuantity,
  updateMartQuantity,
  clearCart,
  walletBalance,
  deductWalletCoins,
  addOrderToActivity
}: UnifiedCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'bnpl'>('upi');
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [splitBreakdown, setSplitBreakdown] = useState<any[]>([]);
  const [checkedOutputSnapshot, setCheckedOutputSnapshot] = useState<any>(null);

  // Razorpay Gateway integration states
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpaySuccessState, setRazorpaySuccessState] = useState(false);

  const calculateSubtotal = () => {
    let total = 0;
    // Food subtotals
    cart.foodItems.forEach(fi => {
      const netUnit = fi.item.price + fi.item.deliveryFee - fi.item.discount;
      total += netUnit * fi.quantity;
    });
    // Mart subtotals
    cart.martItems.forEach(mi => {
      const quote = mi.item.prices.find(p => p.platform === mi.platform);
      if (quote) {
        total += quote.discountedPrice * mi.quantity;
      }
    });
    // Stays subtotals
    if (cart.stayBooking) {
      const deal = cart.stayBooking.hotel.comparisons.find(c => c.platform === cart.stayBooking?.platform);
      if (deal) {
        total += (deal.pricePerNight * cart.stayBooking.totalNights * (cart.stayBooking.query.rooms || 1)) + deal.taxes;
      }
    }
    return total;
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'CHALOSAVE') {
      setDiscountApplied(75);
    } else if (promoCode.toUpperCase() === 'SUPERFIRST') {
      setDiscountApplied(120);
    } else {
      setDiscountApplied(0);
      alert("Invalid coupon code! Try using 'CHALOSAVE' (₹75 Off) or 'SUPERFIRST' (₹120 Off).");
    }
  };

  // Perform checkout split settlement securely after payment authorization
  const completeActualCheckout = () => {
    const finalTotal = calculateSubtotal() - discountApplied;
    const steps: any[] = [];
    cart.foodItems.forEach(fi => {
      const price = (fi.item.price + fi.item.deliveryFee - fi.item.discount) * fi.quantity;
      steps.push({
        merchant: fi.item.restaurant,
        platform: fi.item.platform,
        amount: price,
        status: 'Settled Successfully'
      });
    });

    cart.martItems.forEach(mi => {
      const quote = mi.item.prices.find(p => p.platform === mi.platform);
      if (quote) {
        steps.push({
          merchant: mi.item.name,
          platform: mi.platform,
          amount: quote.discountedPrice * mi.quantity,
          status: 'Settled Successfully'
        });
      }
    });

    if (cart.stayBooking) {
      const deal = cart.stayBooking.hotel.comparisons.find(c => c.platform === cart.stayBooking?.platform);
      if (deal) {
        const amt = (deal.pricePerNight * cart.stayBooking.totalNights * (cart.stayBooking.query.rooms || 1)) + deal.taxes;
        steps.push({
          merchant: cart.stayBooking.hotel.name,
          platform: cart.stayBooking.platform,
          amount: amt,
          status: 'Escrow Confirmed'
        });
      }
    }

    // Capture snapshot for order completion visualization before clearing
    setCheckedOutputSnapshot({
      foodItems: [...cart.foodItems],
      martItems: [...cart.martItems],
      stayBooking: cart.stayBooking ? { ...cart.stayBooking } : undefined,
      subtotal: calculateSubtotal(),
      finalTotal
    });

    setSplitBreakdown(steps);
    setOrderPlaced(true);

    // Save payments and activity items
    steps.forEach(st => {
      addOrderToActivity({
        id: "CHALO-SETTLED-" + Math.floor(100000 + Math.random() * 900000),
        category: cart.stayBooking ? 'stays' : 'mart',
        platform: st.platform,
        merchant: st.merchant,
        title: `Settled: ${st.merchant}`,
        subtitle: `Dispatched via Chalo One split payment engine. Paid via ${paymentMethod.toUpperCase()} (Razorpay Sec)`,
        date: "Today",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: st.amount,
        status: 'completed',
        statusLabel: 'Completed',
        paymentMethod: paymentMethod.toUpperCase()
      });
    });

    // Deduct coins if paid via wallet
    if (paymentMethod === 'wallet') {
      deductWalletCoins(finalTotal);
    }

    // Automatically reset/clear cart now!
    clearCart();
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTotal = calculateSubtotal() - discountApplied;
    if (finalTotal <= 0) return;

    // Trigger Razorpay flow
    setShowRazorpay(true);
  };

  const handleResetCartAndBack = () => {
    setOrderPlaced(false);
    setCheckedOutputSnapshot(null);
  };

  const getSuggestions = () => {
    const list: any[] = [];
    
    // Check if food items are in the cart
    if (cart.foodItems.length > 0) {
      const activePlatform = cart.foodItems[0].item.platform;
      const activeRestaurant = cart.foodItems[0].item.restaurant;
      const hasBiryani = cart.foodItems.some(fi => fi.item.name.toLowerCase().includes('biryani'));
      const hasPizza = cart.foodItems.some(fi => fi.item.name.toLowerCase().includes('pizza'));
      const hasCurry = cart.foodItems.some(fi => fi.item.name.toLowerCase().includes('paneer') || fi.item.name.toLowerCase().includes('chicken'));
      
      if (hasBiryani) {
        list.push({
          id: "s_food_raita",
          name: "Creamy Mint Raita & Salad Cup",
          type: "food",
          price: 60,
          discount: 30,
          deliveryFee: 0,
          rating: 4.8,
          restaurant: activeRestaurant,
          platform: activePlatform,
          image: "https://images.unsplash.com/photo-1546833950-0d3240dec9e3?auto=format&fit=crop&q=80&w=200",
          isVeg: true,
          deliveryTime: 12
        });
        list.push({
          id: "s_food_shahi",
          name: "Saffron Shahi Tukda Dessert",
          type: "food",
          price: 120,
          discount: 30,
          deliveryFee: 0,
          rating: 4.9,
          restaurant: activeRestaurant,
          platform: activePlatform,
          image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=200",
          isVeg: true,
          deliveryTime: 15
        });
      } else if (hasPizza) {
        list.push({
          id: "s_food_garlic",
          name: "Stuffed Cheesy Garlic Bread",
          type: "food",
          price: 139,
          discount: 40,
          deliveryFee: 0,
          rating: 4.6,
          restaurant: activeRestaurant,
          platform: activePlatform,
          image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?auto=format&fit=crop&q=80&w=200",
          isVeg: true,
          deliveryTime: 18
        });
      } else if (hasCurry) {
        list.push({
          id: "s_food_roti",
          name: "Butter Tandoori Roti (Pack of 2)",
          type: "food",
          price: 50,
          discount: 10,
          deliveryFee: 0,
          rating: 4.7,
          restaurant: activeRestaurant,
          platform: activePlatform,
          image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=200",
          isVeg: true,
          deliveryTime: 15
        });
      } else {
        list.push({
          id: "s_food_cola",
          name: "Classic Coke Zero (300ml)",
          type: "food",
          price: 45,
          discount: 5,
          deliveryFee: 0,
          rating: 4.9,
          restaurant: activeRestaurant,
          platform: activePlatform,
          image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200",
          isVeg: true,
          deliveryTime: 10
        });
      }
    }

    // Check if groceries (mart) items are in the cart
    if (cart.martItems.length > 0) {
      const activePlatform = cart.martItems[0].platform;
      const hasDairy = cart.martItems.some(mi => mi.item.name.toLowerCase().includes('milk') || mi.item.name.toLowerCase().includes('butter'));
      
      if (hasDairy) {
        list.push({
          id: "s_mart_bread",
          name: "Harvest Gold Multigrain Bread",
          type: "mart",
          brand: "Harvest Gold",
          weightVolume: "400 g",
          category: "Bakery",
          image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200",
          prices: [
            { platform: activePlatform, price: 55, discountedPrice: 48, deliveryTime: 8, inStock: true }
          ]
        });
        list.push({
          id: "s_mart_eggs",
          name: "Suguna Farm Fresh Eggs",
          type: "mart",
          brand: "Suguna",
          weightVolume: "6 pcs",
          category: "Dairy & Eggs",
          image: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&q=80&w=200",
          prices: [
            { platform: activePlatform, price: 54, discountedPrice: 48, deliveryTime: 7, inStock: true }
          ]
        });
      } else {
        list.push({
          id: "s_mart_cookies",
          name: "Good Day Cashew Butter Cookies",
          type: "mart",
          brand: "Britannia",
          weightVolume: "200 g",
          category: "Snacks",
          image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=200",
          prices: [
            { platform: activePlatform, price: 40, discountedPrice: 35, deliveryTime: 9, inStock: true }
          ]
        });
      }
    }
    return list;
  };

  const hasItems = cart.foodItems.length > 0 || cart.martItems.length > 0 || cart.stayBooking !== undefined;
  const subtotal = calculateSubtotal();
  const finalPrice = Math.max(0, subtotal - discountApplied);
  const suggestions = getSuggestions();

  return (
    <div id="unified_cart_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-gray-950">Chalo One Unified Cart</h2>
          <p className="text-xs text-gray-500">Checkout multiple food, stays, and instamart grocery brands in a single payment</p>
        </div>
      </div>

      {!orderPlaced ? (
        hasItems ? (
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Foods item inside cart */}
            {cart.foodItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded uppercase font-mono">🍔 Food aggregator item(s)</span>
                <div className="space-y-2 pt-1">
                  {cart.foodItems.map(fi => {
                    const priceCombined = (fi.item.price + fi.item.deliveryFee - fi.item.discount) * fi.quantity;
                    return (
                      <div key={`${fi.item.id}-${fi.item.platform}`} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-gray-900">{fi.item.name}</p>
                          <span className="text-[10px] text-orange-600 font-bold uppercase">{fi.item.platform} • {fi.item.restaurant} x{fi.quantity}</span>
                        </div>
                        <div className="flex items-center space-x-3 font-mono text-gray-800">
                          <span className="font-extrabold">₹{priceCombined}</span>
                          <button
                            type="button"
                            onClick={() => updateFoodQuantity(fi.item, -1)}
                            className="text-rose-500 hover:text-rose-700 transition font-bold"
                          >
                            <Trash2 className="w-4 h-4 ml-1 inline" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mart items inside cart */}
            {cart.martItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded uppercase font-mono">🛒 Instant Grocery Item(s)</span>
                <div className="space-y-2 pt-1">
                  {cart.martItems.map(mi => {
                    const quote = mi.item.prices.find(p => p.platform === mi.platform);
                    const combinedPrice = quote ? quote.discountedPrice * mi.quantity : 0;
                    return (
                      <div key={`${mi.item.id}-${mi.platform}`} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-gray-900">{mi.item.name} ({mi.item.weightVolume})</p>
                          <span className="text-[10px] text-indigo-700 font-bold uppercase">{mi.platform} • {mi.item.brand} x{mi.quantity}</span>
                        </div>
                        <div className="flex items-center space-x-3 font-mono text-gray-800">
                          <span className="font-extrabold">₹{combinedPrice}</span>
                          <button
                            type="button"
                            onClick={() => updateMartQuantity(mi.item, mi.platform, -1)}
                            className="text-rose-500 hover:text-rose-700 transition font-bold"
                          >
                            <Trash2 className="w-4 h-4 ml-1 inline" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stay item inside cart */}
            {cart.stayBooking && (
              <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded uppercase font-mono">🏨 Upcoming Stay Hotel booking</span>
                {(() => {
                  const deal = cart.stayBooking.hotel.comparisons.find(c => c.platform === cart.stayBooking?.platform);
                  if (!deal) return null;
                  const combinedPrice = (deal.pricePerNight * cart.stayBooking.totalNights * (cart.stayBooking.query.rooms || 1)) + deal.taxes;
                  return (
                    <div className="flex items-start justify-between text-xs pt-1.5">
                      <div>
                        <p className="font-bold text-gray-950">{cart.stayBooking.hotel.name}</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase">{cart.stayBooking.platform} • {cart.stayBooking.totalNights} Nights, {cart.stayBooking.query.guests} Guests</p>
                      </div>
                      <span className="font-mono font-extrabold text-gray-900">₹{combinedPrice}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SYSTEM ITEM RECOMMENDATIONS ACCORDING TO USER BASKET CONTENT */}
            {suggestions.length > 0 && (
              <div className="bg-indigo-50/45 rounded-2xl border border-indigo-100 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Frequently bought together</span>
                  </div>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black font-mono">Suggested</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map(s => {
                    const priceToRender = s.type === 'food' 
                      ? (s.price - s.discount) 
                      : s.prices[0].discountedPrice;
                    return (
                      <div key={s.id} className="bg-white border border-gray-150 rounded-xl p-2.5 flex items-center space-x-2">
                        <img referrerPolicy="no-referrer" src={s.image} alt={s.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10.5px] font-black text-gray-950 truncate leading-tight">{s.name}</p>
                          <span className="text-[9px] text-gray-400 font-semibold block">{s.type === 'food' ? s.restaurant : s.brand}</span>
                          <span className="font-mono font-extrabold text-slate-800 text-[10.5px] mt-0.5 block">₹{priceToRender}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (s.type === 'food') {
                              updateFoodQuantity(s, 1);
                            } else {
                              updateMartQuantity(s, s.prices[0].platform, 1);
                            }
                            alert(`Excellent choice! Added "${s.name}" to your unified cart.`);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coupon codes & savings planner */}
            <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-2 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Apply Promo Code</span>
              <div className="flex space-x-2">
                <div className="flex items-center bg-gray-50 border border-gray-150 px-2.5 py-1.5 rounded-xl flex-1 shrink-0">
                  <Ticket className="w-4 h-4 text-amber-500 mr-2" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter CHALOSAVE / SUPERFIRST"
                    id="promo_code_input"
                    className="w-full text-xs font-mono font-bold outline-none bg-transparent placeholder-gray-400 uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="bg-gray-800 hover:bg-gray-950 text-white text-xs px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Verify
                </button>
              </div>
              {discountApplied > 0 && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 pl-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Success! Saved ₹{discountApplied} off your everyday basket total.</span>
                </p>
              )}
            </div>

            {/* Payment Systems interface */}
            <div className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Select Settlement Method</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border font-bold flex flex-col justify-between items-start transition text-left cursor-pointer ${
                    paymentMethod === 'upi' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950' : 'bg-white border-gray-150 text-gray-600'
                  }`}
                >
                  <span className="text-xs">UPI AutoPay</span>
                  <span className="text-[9px] text-gray-400 font-mono mt-1 font-semibold">GPay, PhonePe, Bhim API</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border font-bold flex flex-col justify-between items-start transition text-left cursor-pointer ${
                    paymentMethod === 'wallet' ? 'bg-amber-50/70 border-amber-500 text-amber-950' : 'bg-white border-gray-150 text-gray-600'
                  }`}
                >
                  <span className="text-xs flex items-center">
                    <Coins className="w-3.5 h-3.5 mr-1" />
                    Chalo One Wallet
                  </span>
                  <span className="text-[9px] text-amber-600 font-mono mt-1 font-extrabold">Balance: ₹{walletBalance}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border font-bold flex flex-col justify-between items-start transition text-left cursor-pointer ${
                    paymentMethod === 'card' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950' : 'bg-white border-gray-150 text-gray-600'
                  }`}
                >
                  <span className="text-xs">Credit/Debit Card</span>
                  <span className="text-[9px] text-gray-400 font-mono mt-1 font-semibold">Secure split Gateway</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bnpl')}
                  className={`p-3 rounded-xl border font-bold flex flex-col justify-between items-start transition text-left cursor-pointer ${
                    paymentMethod === 'bnpl' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950' : 'bg-white border-gray-150 text-gray-600'
                  }`}
                >
                  <span className="text-xs">Chalo One Pay Later</span>
                  <span className="text-[9px] text-gray-400 font-mono mt-1 font-semibold">0% interest / 15-day cycle</span>
                </button>
              </div>
            </div>

            {/* Bill Summary breakdowns */}
            <div className="bg-gray-50 rounded-2xl border border-gray-150 p-4 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5 font-mono">Invoice Summary</span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cart Subtotal</span>
                  <span className="font-mono">₹{subtotal}</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-semibold">Promo Discount</span>
                    <span className="font-mono">-₹{discountApplied}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-gray-950">
                  <span>Grand Total</span>
                  <span className="font-mono text-base font-extrabold text-amber-600">₹{finalPrice}</span>
                </div>
              </div>

              {paymentMethod === 'wallet' && walletBalance < finalPrice && (
                <div className="bg-red-50 text-red-700 p-2 text-[10px] rounded-lg font-bold border border-red-200">
                  ⚠️ Insufficient balance in Chalo One wallet. Balance matches ₹{walletBalance}. Please select another payment method or refer friends to earn cashback.
                </div>
              )}

              <button
                type="submit"
                id="checkout_complete_btn"
                disabled={paymentMethod === 'wallet' && walletBalance < finalPrice}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl transition shadow-md text-xs cursor-pointer tracking-wider uppercase flex items-center justify-center space-x-2 mt-2"
              >
                <span>Authorize & Place Split Settlement Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-150">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-600">Your basket is empty.</h3>
            <p className="text-xs text-gray-400 mt-1">Navigate to Food, Mart, or Stays to compile comparative listings in Chalo One!</p>
          </div>
        )
      ) : (
        /* Order completion screen with beautiful split payments settlement tracing chart */
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-md space-y-4">
          <div className="text-center space-y-2 py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-gray-950">Grand Payment Settled!</h3>
            <p className="text-xs text-gray-500">Your multi-platform cart has been processed and routed securely to partner databases.</p>
          </div>

          {/* Settle Visual Tracker Block */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-gray-800">
              <span className="text-gray-400">CHALO SPLIT ROUTER V3.2</span>
              <span className="text-emerald-400 font-bold">STABLE CONNECTION</span>
            </div>

            <div className="space-y-2.5">
              {splitBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between text-[11px] font-mono leading-relaxed">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold">
                      <span className="text-amber-400">⚡ {item.platform}</span>
                      <span className="text-gray-500">➔</span>
                      <span className="text-gray-200">{item.merchant}</span>
                    </div>
                    <span className="text-gray-500 block text-[9px]">Vendor node code verified.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">₹{item.amount}</span>
                    <span className="block text-[9px] text-emerald-500 font-bold uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[10px] text-gray-400 font-sans border-t border-gray-800 text-center uppercase tracking-wider">
              Settlements completed through our sandbox Escrow gateway.
            </div>
          </div>

          <button
            type="button"
            id="clear_reset_cart_btn"
            onClick={handleResetCartAndBack}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Start New Unified Shopping Basket
          </button>
        </div>
      )}

      {/* RAZORPAY GATEWAY SIMULATION MODAL OVERLAY */}
      {showRazorpay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 text-xs font-sans">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-indigo-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Razorpay Logo branding */}
            <div className="bg-[#111827] p-4.5 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[10px] text-indigo-300 font-mono font-bold tracking-widest block uppercase">Secure payment</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-black text-sm uppercase tracking-tight">Razorpay</span>
                  <span className="bg-blue-600 text-[8px] font-black uppercase px-1 rounded-sm">Sandbox Gateway</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-indigo-300">Merch ID</p>
                <p className="text-[10.5px] font-black text-amber-300 leading-none">Chalo One SuperApp</p>
              </div>
            </div>

            {/* Price section and items summary */}
            <div className="p-5 space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-120 text-center">
                <span className="text-[9.5px] text-indigo-700 font-extrabold uppercase tracking-wider block font-mono">Grand amount to authorize</span>
                <span className="text-3xl font-black text-slate-950 font-mono mt-0.5 block">₹{finalPrice.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 font-bold block mt-1 font-sans">Method: {paymentMethod.toUpperCase()} Settlement Link</span>
              </div>

              {/* Secure sandbox details form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase font-mono tracking-wider font-bold block">Secure Endpoint Redirect URL</span>
                  <div className="bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-xs text-slate-600 flex items-center justify-between font-mono">
                    <span className="truncate max-w-[85%] font-medium">api.razorpay.com/v1/checkout/gateway_auth_id</span>
                    <span className="text-[8px] text-emerald-600 font-bold shrink-0">● ONLINE</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 uppercase font-mono tracking-wider block font-bold">Simulated billing phone / Email</label>
                  <input
                    type="text"
                    disabled
                    value="kunal_chalo@everyday.in | +91 9876543210"
                    className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl text-xs w-full font-bold text-gray-600"
                  />
                  <p className="text-[8.5px] text-gray-400 leading-tight leading-normal mt-1">This transaction is compliant with Razorpay split checkout API constraints. All credentials are fully secure.</p>
                </div>
              </div>

              {/* Interactive payment controller */}
              <div className="space-y-2 pt-2">
                {razorpayLoading ? (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center space-y-2.5 animate-pulse">
                    <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10.5px] font-black text-indigo-900 uppercase tracking-tight">HANDSHAKE SIGNATURE IN PROGRESS...</p>
                    <p className="text-[9px] text-indigo-600 font-medium">Please do not refresh. Securing transactions escrow...</p>
                  </div>
                ) : razorpaySuccessState ? (
                  <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4 text-center space-y-1 text-emerald-800 flex flex-col items-center justify-center animate-bounce">
                    <p className="text-xs font-black uppercase tracking-wider">✔ verification success</p>
                    <p className="text-[9.5px] font-medium text-emerald-600">Emitting legal callback signature instantly...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRazorpay(false)}
                      className="py-2.5 border border-gray-150 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-extrabold uppercase transition cursor-pointer"
                    >
                      Cancel Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRazorpayLoading(true);
                        setTimeout(() => {
                          setRazorpayLoading(false);
                          setRazorpaySuccessState(true);
                          setTimeout(() => {
                            setShowRazorpay(false);
                            setRazorpaySuccessState(false);
                            completeActualCheckout();
                          }, 1200);
                        }, 2000);
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all border-b-2 border-amber-650 flex items-center justify-center"
                    >
                      💳 Pay via Razorpay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with safety branding */}
            <div className="bg-slate-50 border-t border-gray-150 p-3 text-center text-[9px] text-gray-400 font-mono tracking-widest uppercase">
              🔒 PCI-DSS COMPLIANT • 256-BIT ENCRYPTION
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
