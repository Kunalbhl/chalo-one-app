import React, { useMemo } from 'react';
import { ArrowLeft, RefreshCw, Star, Info } from 'lucide-react';
import { useFood } from './FoodContext';
import { MenuCategory } from './MenuCategory';
import { MenuItem } from './MenuItem';

export const RestaurantMenu: React.FC = React.memo(() => {
  const {
    selectedRestaurant,
    setSelectedRestaurant,
    connectedAccounts,
    currentSelectedLocation,
    redirectToLinkedAccounts,
    dietFilter
  } = useFood();

  const handleBack = React.useCallback(() => {
    setSelectedRestaurant(null);
  }, [setSelectedRestaurant]);

  // Extract all "best", "repeated" or "recommended" chef picks
  const topDishes = useMemo(() => {
    if (!selectedRestaurant) return [];
    const itemsList: any[] = [];
    selectedRestaurant.menuCategories.forEach(cat => {
      cat.items.forEach(it => {
        if (it.tag === 'best' || it.tag === 'repeated' || it.tag === 'recommended') {
          itemsList.push(it);
        }
      });
    });
    // Filter out based on current diet filter
    return itemsList.filter(it => 
      dietFilter === 'All' || it.dietType === dietFilter
    );
  }, [selectedRestaurant, dietFilter]);

  if (!selectedRestaurant) return null;

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-350">
      
      {/* DETAIL SCREEN HEADER HERO */}
      <div className="relative rounded-3xl overflow-hidden h-40 bg-slate-900 text-white border border-gray-150 shadow-sm">
        <img
          src={selectedRestaurant.bannerImage}
          alt={selectedRestaurant.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
        
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/20 transition cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider font-mono">Chalo Verified Partner</span>
            <h2 className="text-lg sm:text-xl font-display font-black tracking-tight leading-none">{selectedRestaurant.name}</h2>
            <p className="text-xs text-gray-300 font-medium">{selectedRestaurant.cuisine}</p>
          </div>

          <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-200">
            <span className="flex items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10">⭐ {selectedRestaurant.rating} rated</span>
            <span className="flex items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10">🕒 ~{selectedRestaurant.deliveryTime} mins</span>
          </div>
        </div>
      </div>

      {/* PLATFORM ACCOUNT STATUS CARD */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center space-x-2 text-slate-700 font-medium">
          <Info className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            Linked platform nodes: 
            <strong className="font-extrabold text-slate-900 ml-1">
              {[
                connectedAccounts?.swiggyConnected && 'Swiggy ✅',
                connectedAccounts?.zomatoConnected && 'Zomato ✅',
                connectedAccounts?.eatSureConnected && 'EatSure ✅'
              ].filter(Boolean).join(', ') || 'Zomato/Swiggy linked via Sandbox'}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={redirectToLinkedAccounts}
          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 border border-rose-100 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Re-sync accounts</span>
        </button>
      </div>

      {/* CHEF'S TOP RECOMMENDED CARDS */}
      {topDishes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-800 font-mono">👨‍🍳 Chef's Handpicked Favourites</h4>
          <div className="flex gap-3 overflow-x-auto pb-2.5 scrollbar-none snap-x">
            {topDishes.map(dish => (
              <div key={dish.id} className="w-56 shrink-0 snap-start">
                <MenuItem dish={dish} isTopDish={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY WISE COMPACT LIST */}
      <div className="space-y-6 pt-2">
        {selectedRestaurant.menuCategories.map(category => (
          <MenuCategory key={category.name} category={category} />
        ))}
      </div>
    </div>
  );
});

RestaurantMenu.displayName = 'RestaurantMenu';
