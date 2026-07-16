import React, { useMemo } from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { useFood } from './FoodContext';
import { RestaurantCard } from './RestaurantCard';

export const RestaurantList: React.FC = React.memo(() => {
  const {
    restaurants,
    debouncedSearchQuery,
    dietFilter,
    selectedCuisine,
    localPreferenceMode,
    defaultFoodOrder,
    loading,
    loadingMore,
    hasMore,
    loadMoreRestaurants
  } = useFood();

  const filteredAndSorted = useMemo(() => {
    return [...restaurants].filter(outlet => {
      // Main page search filter
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const matchesOutlet = outlet.name.toLowerCase().includes(q) || outlet.cuisine.toLowerCase().includes(q);
        const matchesAnyItem = outlet.menuCategories?.some(cat => 
          cat.items.some(it => it.name.toLowerCase().includes(q))
        ) || false;
        if (!matchesOutlet && !matchesAnyItem) return false;
      }

      // Main page diet filter check
      if (dietFilter !== 'All') {
        const hasMatchingDietItem = outlet.menuCategories?.some(cat => 
          cat.items.some(it => it.dietType === dietFilter)
        ) || false;
        if (!hasMatchingDietItem) return false;
      }

      // Cuisine filter check
      if (selectedCuisine !== 'All') {
        const matchesCuisine = outlet.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
        if (!matchesCuisine) return false;
      }

      return true;
    }).sort((a, b) => {
      if (localPreferenceMode === 'cheapest') {
        const priceA = a.menuCategories?.[0]?.items?.[0]?.price || 999;
        const priceB = b.menuCategories?.[0]?.items?.[0]?.price || 999;
        return priceA - priceB;
      } else if (localPreferenceMode === 'fastest') {
        return a.deliveryTime - b.deliveryTime;
      } else if (localPreferenceMode === 'rated') {
        return b.rating - a.rating;
      } else {
        const idxA = defaultFoodOrder ? defaultFoodOrder.indexOf(a.name) : -1;
        const idxB = defaultFoodOrder ? defaultFoodOrder.indexOf(b.name) : -1;
        const valA = idxA === -1 ? 99 : idxA;
        const valB = idxB === -1 ? 99 : idxB;
        return valA - valB;
      }
    });
  }, [restaurants, debouncedSearchQuery, dietFilter, selectedCuisine, localPreferenceMode, defaultFoodOrder]);

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
        <p className="text-xs font-semibold">Scanning sandboxes for the best deals...</p>
      </div>
    );
  }

  if (filteredAndSorted.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold font-sans">
        No outlets match your active search filters. Try resetting diet or cuisine.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center space-x-1 text-slate-800">
        <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
          Listed Outlets & Kitchens ({filteredAndSorted.length})
        </span>
      </div>

      <div className="space-y-3.5">
        {filteredAndSorted.map(outlet => (
          <RestaurantCard key={outlet.id || outlet.name} restaurant={outlet} />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div className="pt-4 pb-8 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={loadMoreRestaurants}
            className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-extrabold border border-rose-100 cursor-pointer shadow-xs transition-colors disabled:opacity-50 font-mono"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading more outlets...</span>
              </span>
            ) : (
              'Load More Outlets ➔'
            )}
          </button>
        </div>
      )}
    </div>
  );
});

RestaurantList.displayName = 'RestaurantList';
