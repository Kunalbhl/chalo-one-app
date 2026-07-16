import React from 'react';
import { Star, ChevronRight, Heart } from 'lucide-react';
import { useFood, DetailedRestaurant } from './FoodContext';
import { LazyImage } from './LazyImage';

interface RestaurantCardProps {
  restaurant: DetailedRestaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = React.memo(({ restaurant }) => {
  const { setSelectedRestaurant, favorites, toggleFavorite } = useFood();

  const isFavorite = favorites.includes(restaurant.id);

  return (
    <div
      onClick={() => setSelectedRestaurant(restaurant)}
      className="bg-white rounded-3xl border border-gray-150 hover:border-rose-400 hover:shadow-md transition-all p-3.5 flex flex-col sm:flex-row gap-4.5 cursor-pointer shadow-xs relative group font-sans"
    >
      {/* Banner Photo */}
      <div className="relative w-full sm:w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
        <LazyImage
          src={restaurant.bannerImage}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex items-center bg-white/95 px-1.5 py-0.5 rounded-lg border border-gray-150 shadow-xs">
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 mr-1 shrink-0" />
          <span className="text-[9.5px] font-mono font-black text-gray-800 leading-none">{restaurant.rating}</span>
        </div>
        
        {/* Favorite Heart Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(restaurant.id);
          }}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1 rounded-full border border-gray-150 shadow-xs text-rose-500 transition-colors"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Info block */}
      <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-display font-black text-gray-950 tracking-tight leading-tight group-hover:text-rose-900 transition-colors">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1.5">
              {restaurant.platforms.map(p => (
                <span 
                  key={p} 
                  className={`text-[7.5px] font-mono font-extrabold px-1 rounded-sm text-white uppercase ${
                    p === 'Zomato' ? 'bg-red-500' : p === 'Swiggy' ? 'bg-orange-500' : p === 'EatSure' ? 'bg-[#5e17eb]' : 'bg-[#10b981]'
                  }`}
                >
                  {p[0]}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{restaurant.cuisine}</p>
          <p className="text-[10px] text-gray-400 italic pr-5 mt-1 truncate">"{restaurant.tagline}"</p>
        </div>

        <div className="flex items-center justify-between text-[10.5px] font-mono pt-2 border-t border-dotted border-gray-150 text-slate-500">
          <span className="font-semibold block">🕒 ~{restaurant.deliveryTime} mins arrival</span>
          <span className="text-rose-600 font-extrabold flex items-center text-[10px] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
            View Menu <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';
