import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { FoodItem, UnifiedCart } from '../types';
import { FoodProvider, useFood } from './food/FoodContext';
import { SearchBar } from './food/SearchBar';
import { FilterBar } from './food/FilterBar';
import { RestaurantList } from './food/RestaurantList';
import { RestaurantMenu } from './food/RestaurantMenu';
import { CustomizationModal } from './food/CustomizationModal';
import { CartDrawer } from './food/CartDrawer';

interface FoodModuleProps {
  cart: UnifiedCart;
  addToCart: (item: FoodItem) => void;
  removeFromCart: (item: FoodItem) => void;
  preferenceMode: string;
  defaultFoodOrder: string[];
  defaultFoodType?: 'Veg' | 'Non-Veg' | 'Eggetarian' | "Doesn't Matter";
  setActiveTab?: (tab: string) => void;
  connectedAccounts?: any;
  currentSelectedLocation?: string;
  redirectToLinkedAccounts?: () => void;
  onBackRegister?: (handler: (() => boolean) | null) => void;
}

const FoodModuleInner: React.FC = React.memo(() => {
  const {
    selectedRestaurant,
    setSelectedRestaurant,
    setFocusedDishId,
    connectedAccounts,
    redirectToLinkedAccounts,
    setActiveTab,
    cart,
    setIsCartOpen
  } = useFood();

  const [showLinkBanner, setShowLinkBanner] = useState(true);

  const cartItemsCount = React.useMemo(() => {
    return cart.foodItems.reduce((acc, line) => acc + line.quantity, 0);
  }, [cart.foodItems]);

  const cartTotal = React.useMemo(() => {
    return cart.foodItems.reduce((acc, line) => acc + (line.item.price * line.quantity), 0);
  }, [cart.foodItems]);

  return (
    <div id="food_module_container" className="p-4 max-w-6xl mx-auto w-full space-y-4 font-sans text-gray-800">
      
      {/* Dynamic Header */}
      {!selectedRestaurant ? (
        <div className="flex items-center space-x-2 pb-2">
          <div className="p-2 bg-rose-100 rounded-2xl text-rose-600 shadow-sm">
            <ShoppingBag className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold tracking-tight text-rose-950">Intelligent Food Delivery</h2>
            <p className="text-xs text-gray-500">Compare delivery nodes in real-time. Best pricing guaranteed</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setSelectedRestaurant(null);
            setFocusedDishId(null);
          }}
          className="flex items-center space-x-2 text-rose-600 hover:text-rose-700 transition font-extrabold text-xs tracking-wider uppercase mb-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 w-fit"
        >
          <span>← Back to All Outlets</span>
        </button>
      )}

      {/* RENDER DUAL VIEW: RESTAURANTS LIST VIEW vs SELECTED DETAIL VIEW */}
      {!selectedRestaurant ? (
        <>
          {/* Global Unified Search with history suggestions */}
          <SearchBar />

          {/* ACTIVE E-COMMERCE NODE AGGREGATOR BADGES */}
          <div className="bg-gradient-to-r from-rose-950 to-slate-900 rounded-2xl p-3 text-white space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-bold text-rose-200">
              <span>CONNECTED DELIVERY NODES</span>
              <span className="text-emerald-400 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 animate-pulse" /> Comparison Engine Active
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              <div className="bg-red-500/20 border border-red-500/40 p-2 rounded-xl text-center">
                <p className="text-[10px] font-black text-red-200 leading-none">ZOMATO</p>
                <span className="text-[8px] text-gray-400 block font-mono mt-1">11ms speed</span>
              </div>
              <div className="bg-orange-500/20 border border-orange-500/40 p-2 rounded-xl text-center">
                <p className="text-[10px] font-black text-orange-200 leading-none">SWIGGY</p>
                <span className="text-[8px] text-gray-400 block font-mono mt-1">14ms speed</span>
              </div>
              <div className="bg-indigo-500/20 border border-indigo-500/40 p-2 rounded-xl text-center">
                <p className="text-[10px] font-black text-indigo-200 leading-none">EATSURE</p>
                <span className="text-[8px] text-gray-400 block font-mono mt-1">9ms speed</span>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-2 rounded-xl text-center">
                <p className="text-[10px] font-black text-emerald-200 leading-none">ZEPTO CAFE</p>
                <span className="text-[8px] text-gray-400 block font-mono mt-1">7ms speed</span>
              </div>
            </div>
          </div>

          {showLinkBanner && (!connectedAccounts || !connectedAccounts.zomato || !connectedAccounts.swiggy || !connectedAccounts.eatsure) && (
            <div 
              onClick={() => { if (redirectToLinkedAccounts) { redirectToLinkedAccounts(); } else if (setActiveTab) { setActiveTab('account'); } }}
              className="bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-rose-900 font-medium font-sans cursor-pointer transition-all shadow-xs group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base shrink-0 group-hover:scale-110 transition">💡</span>
                <span>
                  Link your <strong className="font-bold text-rose-950">Zomato, Swiggy, and EatSure</strong> accounts to dynamically sync SuperCoins, Active Pro memberships, and loyalty benefits!
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="bg-rose-600 group-hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition">
                  Link Now ➔
                </span>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLinkBanner(false);
                  }} 
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5 py-1"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* DIET, CUISINE SELECTION, AND SORTING OPTIONS FOR MAIN DIRECTORY */}
          <FilterBar />

          {/* LIST OF RESTAURANTS GRID */}
          <RestaurantList />
        </>
      ) : (
        /* RENDER SELECTED RESTAURANT DETAILED VIEW MODE */
        <RestaurantMenu />
      )}

      {/* Floating Check Cart indicator at bottom */}
      {cartItemsCount > 0 && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3.5 z-40 hover:bg-rose-700 transition cursor-pointer select-none border border-rose-500 animate-bounce"
        >
          <div className="relative">
            <ShoppingBag className="w-4.5 h-4.5" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-rose-600 text-[8px] font-black px-1.2 py-0.2 rounded-full leading-none">
              {cartItemsCount}
            </span>
          </div>
          <div className="text-left leading-none font-sans">
            <span className="text-[10px] uppercase tracking-widest block font-bold text-rose-100 font-mono">Guaranteed Savings</span>
            <span className="text-xs font-extrabold block font-mono">View Cart (₹{cartTotal}) ➔</span>
          </div>
        </div>
      )}

      {/* Addons selection modal */}
      <CustomizationModal />

      {/* Slide-out cart drawer */}
      <CartDrawer />
    </div>
  );
});

FoodModuleInner.displayName = 'FoodModuleInner';

export default function FoodModule(props: FoodModuleProps) {
  return (
    <FoodProvider {...props}>
      <FoodModuleInner />
    </FoodProvider>
  );
}
