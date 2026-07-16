import React, { useCallback, useMemo } from 'react';
import { Star, TrendingDown, ChevronRight } from 'lucide-react';
import { useFood } from './FoodContext';
import { LazyImage } from './LazyImage';
import { FoodItem } from '../../types';

interface MenuItemProps {
  dish: any;
  isTopDish?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = React.memo(({ dish, isTopDish = false }) => {
  const {
    cart,
    addToCart,
    removeFromCart,
    focusedDishId,
    setFocusedDishId,
    selectedRestaurant,
    setCustomizationDish
  } = useFood();

  const isFocused = focusedDishId === dish.id;

  const getNetPriceForDeal = useCallback((deal: { price: number; deliveryFee: number; discount: number }) => {
    return deal.price + deal.deliveryFee - deal.discount;
  }, []);

  const cheapestDeal = useMemo(() => {
    return [...dish.platformDeals].sort((a, b) => getNetPriceForDeal(a) - getNetPriceForDeal(b))[0];
  }, [dish.platformDeals, getNetPriceForDeal]);

  const activePlatformInCart = useMemo(() => {
    const matched = cart.foodItems.find(fi => fi.item.id === dish.id);
    return matched ? matched.item.platform : null;
  }, [cart.foodItems, dish.id]);

  const activeDeal = useMemo(() => {
    const chosenPlatform = activePlatformInCart || cheapestDeal.platform;
    return dish.platformDeals.find((d: any) => d.platform === chosenPlatform) || cheapestDeal;
  }, [dish.platformDeals, activePlatformInCart, cheapestDeal]);

  const netPrice = useMemo(() => getNetPriceForDeal(activeDeal), [activeDeal, getNetPriceForDeal]);

  const qty = useMemo(() => {
    const matched = cart.foodItems.find(fi => fi.item.id === dish.id && fi.item.platform === activeDeal.platform);
    return matched ? matched.quantity : 0;
  }, [cart.foodItems, dish.id, activeDeal.platform]);

  const combinedQty = useMemo(() => {
    let tot = 0;
    cart.foodItems.forEach(fi => {
      if (fi.item.id === dish.id) {
        tot += fi.quantity;
      }
    });
    return tot;
  }, [cart.foodItems, dish.id]);

  const buildFoodModel = useCallback((chosenDeal: any): FoodItem => {
    return {
      id: dish.id,
      name: dish.name,
      restaurant: selectedRestaurant?.name || 'Restaurant',
      platform: chosenDeal.platform,
      price: chosenDeal.price,
      deliveryFee: chosenDeal.deliveryFee,
      discount: chosenDeal.discount,
      deliveryTime: chosenDeal.deliveryTime,
      rating: chosenDeal.rating,
      image: dish.image,
      isVeg: dish.isVeg
    };
  }, [dish, selectedRestaurant]);

  const handleCardClick = useCallback(() => {
    setFocusedDishId(isFocused ? null : dish.id);
  }, [isFocused, dish.id, setFocusedDishId]);

  const handleCustomizationTrigger = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomizationDish(dish);
  }, [dish, setCustomizationDish]);

  if (isTopDish) {
    // Premium Chef Pick Layout
    return (
      <div 
        onClick={handleCardClick}
        className={`bg-white rounded-3xl p-3.5 border transition-all cursor-pointer relative shadow-sm hover:border-amber-400 flex flex-col justify-between h-44 font-sans ${
          isFocused ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-150'
        }`}
      >
        {/* Promo Tag Label */}
        <span className={`absolute top-2 left-2 text-[7.5px] font-black uppercase text-white px-2 py-0.5 rounded ${
          dish.tag === 'best' ? 'bg-amber-500' : dish.tag === 'repeated' ? 'bg-orange-500' : 'bg-indigo-600'
        }`}>
          {dish.tag === 'best' ? '🏆 Chef\'s Best' : dish.tag === 'repeated' ? '🔁 Often Repeated' : '🎯 RECOMMENDED'}
        </span>

        {/* Icon Veg Indicator */}
        <span className="absolute top-2 right-2 bg-white/95 p-1 rounded border border-gray-100">
          <div className={`w-2 h-2 border ${dish.isVeg ? 'border-emerald-600' : 'border-red-650'} flex items-center justify-center p-0.5`}>
            <div className={`w-1 h-1 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-650'}`}></div>
          </div>
        </span>

        <div className="pt-2">
          <p className="text-[11.5px] font-black text-slate-900 font-display tracking-tight leading-tight line-clamp-2 mt-4.5">{dish.name}</p>
          <p className="text-[9.5px] text-gray-400 font-mono mt-1 pr-1 truncate block capitalize">{dish.dietType}</p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-dotted border-gray-150">
          <div>
            <p className="text-[8px] text-gray-400 uppercase font-bold font-mono">Cheapest</p>
            <span className="text-sm font-black text-slate-900 font-mono">₹{getNetPriceForDeal(cheapestDeal)}</span>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(buildFoodModel(activeDeal));
            }}
            className="bg-rose-50/70 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider block shrink-0 cursor-pointer border border-rose-100"
          >
            {combinedQty > 0 ? `In Cart (${combinedQty})` : 'Add +'}
          </button>
        </div>
      </div>
    );
  }

  // Standard category wise list view item
  return (
    <div
      className={`bg-white rounded-3xl border transition-all p-3.5 flex flex-col relative gap-3.5 font-sans ${
        isFocused 
          ? 'border-rose-450 shadow-md ring-1 ring-rose-300/35' 
          : 'border-gray-150 hover:border-gray-300'
      }`}
    >
      {/* Inner Dish Row */}
      <div 
        onClick={handleCardClick}
        className="flex gap-3.5 cursor-pointer"
      >
        <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-50">
          <LazyImage
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          
          {/* Veg badge */}
          <span className="absolute bottom-1.5 left-1.5 bg-white/95 p-1 rounded border border-gray-200">
            <div className={`w-2 h-2 border ${dish.isVeg ? 'border-emerald-600' : 'border-red-650'} flex items-center justify-center p-0.5`}>
              <div className={`w-1 h-1 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-650'}`}></div>
            </div>
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between items-start">
            <h5 className="text-[12.5px] font-black text-slate-900 font-display line-clamp-1 pr-6 leading-tight">{dish.name}</h5>
            <span className="flex items-center text-[9px] font-bold bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-mono shrink-0">
              ★ {activeDeal.rating}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium leading-normal line-clamp-2 pr-2">{dish.description}</p>
          
          <div className="flex flex-wrap gap-2.5 pt-1 text-[9px] font-mono text-slate-400">
            <span>🕒 {activeDeal.deliveryTime} mins arrival</span>
            <span>•</span>
            <span className="text-slate-500 font-bold">Via platform: <b className="text-rose-600 uppercase font-black">{activeDeal.platform}</b></span>
          </div>
        </div>
      </div>

      {/* Interactive pricing row */}
      <div className="flex items-end justify-between pt-2.5 border-t border-dotted border-gray-150 font-mono">
        <div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm font-black text-slate-950">₹{netPrice}</span>
            <span className="text-[10.5px] text-gray-400 line-through font-mono">₹{activeDeal.price}</span>
          </div>
          <span className="text-[8.5px] text-gray-400 block font-sans">Menu ₹{activeDeal.price} + Fee ₹{activeDeal.deliveryFee} - Off ₹{activeDeal.discount}</span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCustomizationTrigger}
            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[8.5px] font-extrabold uppercase font-sans border border-amber-200"
          >
            Customize ⚙
          </button>

          <button
            type="button"
            onClick={handleCardClick}
            className="px-3 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-xl text-[9px] font-black uppercase tracking-wider block border border-rose-100 cursor-pointer text-center font-mono"
          >
            {isFocused ? 'Close Compare' : 'Compare Platform Deals ⚖'}
          </button>

          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-0.5 rounded-xl shrink-0 font-mono">
            {qty > 0 && (
              <button
                type="button"
                onClick={() => removeFromCart(buildFoodModel(activeDeal))}
                className="px-2 hover:bg-rose-50 text-rose-600 font-black text-xs transition cursor-pointer"
              >
                -
              </button>
            )}
            <span className={`text-[10px] font-black px-1.5 uppercase ${qty > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              {qty > 0 ? `${qty} In` : 'ADD'}
            </span>
            <button
              type="button"
              onClick={() => addToCart(buildFoodModel(activeDeal))}
              className="p-1 px-2.2 hover:bg-rose-500 hover:text-white text-rose-600 bg-rose-50 rounded-lg transition font-black text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* CROSS PLATFORM COMPARATIVE PRICE TRACER DRAWER */}
      {isFocused && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5 animate-in slide-in-from-top-2 duration-300 font-sans shadow-inner">
          <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/10 pb-2">
            <span className="text-rose-300 font-extrabold uppercase shrink-0">⚖ Real-Time Cross-Platform Comparison</span>
            <span className="text-[9px] text-emerald-400 font-bold block bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Checked Sandboxes</span>
          </div>

          <div className="space-y-1.5 font-mono text-[10.5px]">
            {[...dish.platformDeals]
              .sort((a, b) => getNetPriceForDeal(a) - getNetPriceForDeal(b))
              .map((deal, idx) => {
                const combinedNetCost = getNetPriceForDeal(deal);
                const isLowest = idx === 0;
                const isInCartDealt = cart.foodItems.find(fi => fi.item.id === dish.id && fi.item.platform === deal.platform)?.quantity || 0;

                return (
                  <div 
                    key={deal.platform}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isLowest 
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' 
                        : 'bg-white/5 border-white/5 text-gray-200'
                    }`}
                  >
                    <div className="min-w-0 text-left">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-black text-white px-1.5 py-0.2 rounded ${
                          deal.platform === 'Zomato' ? 'bg-red-500' : deal.platform === 'Swiggy' ? 'bg-orange-500' : deal.platform === 'EatSure' ? 'bg-purple-600' : 'bg-emerald-600'
                        }`}>
                          {deal.platform}
                        </span>
                        {isLowest && (
                          <span className="text-[7.5px] bg-emerald-500 text-slate-950 font-black uppercase px-1 rounded-xs">Best Deal</span>
                        )}
                      </div>
                      <span className="text-[8.5px] text-gray-400 block mt-1">Menu: ₹{deal.price} + Fee: ₹{deal.deliveryFee} - Coupon: ₹{deal.discount}</span>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="text-[12.5px] font-black tracking-tight block">₹{combinedNetCost}</span>
                        <span className="text-[8px] text-gray-400 block">🕒 {deal.deliveryTime} mins</span>
                      </div>

                      {/* Direct add best deal controller */}
                      <div className="flex items-center space-x-1 bg-white/10 p-0.5 rounded-lg border border-white/5">
                        {isInCartDealt > 0 && (
                          <button
                            type="button"
                            onClick={() => removeFromCart(buildFoodModel(deal))}
                            className="px-1.5 text-rose-400 hover:text-rose-500 font-extrabold text-[11px]"
                          >
                            -
                          </button>
                        )}
                        <span className="text-[9.5px] font-extrabold text-white px-1">
                          {isInCartDealt > 0 ? `${isInCartDealt} In` : 'Add'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(buildFoodModel(deal));
                          }}
                          className="p-1 px-2.2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-md font-extrabold text-[10px] transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5 font-sans justify-center">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Use Chalo comparator to swap platform nodes. Save cash instantly!</span>
          </div>
        </div>
      )}
    </div>
  );
});

MenuItem.displayName = 'MenuItem';
