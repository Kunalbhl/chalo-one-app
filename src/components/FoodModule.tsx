import React, { useState, useEffect } from 'react';
import { FOOD_ITEMS } from '../data';
import { FoodItem, UnifiedCart } from '../types';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Star, 
  ShieldCheck, 
  Filter, 
  AlertCircle, 
  ShoppingCart, 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  RotateCcw,
  BadgeAlert,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface FoodModuleProps {
  cart: UnifiedCart;
  addToCart: (item: FoodItem) => void;
  removeFromCart: (item: FoodItem) => void;
  preferenceMode: string;
  defaultFoodOrder: string[];
  defaultFoodType?: 'Veg' | 'Non-Veg' | 'Eggetarian' | "Doesn't Matter";
}

// Enhanced detailed local restaurant database representation
interface DetailedRestaurant {
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: number;
  bannerImage: string;
  tagline: string;
  platforms: string[];
  menuCategories: {
    name: string;
    items: {
      id: string;
      name: string;
      description: string;
      price: number; // Base reference price 
      dietType: 'Veg' | 'Non-Veg' | 'Eggetarian';
      isVeg: boolean;
      tag?: 'best' | 'repeated' | 'recommended';
      image: string;
      // Comparative details calculated platform-wise
      platformDeals: {
        platform: string;
        price: number;
        deliveryFee: number;
        discount: number;
        rating: number;
        deliveryTime: number;
      }[];
    }[];
  }[];
}

const DETAILED_RESTAURANTS: DetailedRestaurant[] = [
  {
    name: 'Behrouz Biryani',
    cuisine: 'Royal Mughlai Biryanis & Nawabi Kebabs',
    rating: 4.7,
    deliveryTime: 28,
    bannerImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    tagline: 'Lucknowi Dum-baked biryanis crafted for royalty, infused with pure saffron.',
    platforms: ['Zomato', 'Swiggy', 'EatSure'],
    menuCategories: [
      {
        name: 'Mughlai Main Courses',
        items: [
          {
            id: 'f_beh_b1',
            name: 'Special Chicken Dum Biryani',
            description: 'Tender chicken marinated in secret hand-ground spices, layered with long grain basmati rice, slow-cooked over firewood.',
            price: 349,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 349, deliveryFee: 35, discount: 50, rating: 4.4, deliveryTime: 35 },
              { platform: 'Zomato', price: 339, deliveryFee: 20, discount: 60, rating: 4.4, deliveryTime: 30 },
              { platform: 'EatSure', price: 310, deliveryFee: 0, discount: 40, rating: 4.5, deliveryTime: 28 }
            ]
          },
          {
            id: 'f_beh_b2',
            name: 'Peshawari Paneer Dum Biryani',
            description: 'Char-grilled fresh cottage cheese chunks tossed in royal gravy, cooked under traditional dough sealing.',
            price: 299,
            dietType: 'Veg',
            isVeg: true,
            tag: 'repeated',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 299, deliveryFee: 30, discount: 40, rating: 4.3, deliveryTime: 32 },
              { platform: 'Zomato', price: 289, deliveryFee: 15, discount: 50, rating: 4.2, deliveryTime: 28 },
              { platform: 'EatSure', price: 275, deliveryFee: 0, discount: 30, rating: 4.4, deliveryTime: 25 }
            ]
          }
        ]
      },
      {
        name: 'Nawabi Breads & Desserts',
        items: [
          {
            id: 'f_beh_d1',
            name: 'Saffron Shahi Tukda Dessert',
            description: 'Crispy fried bread slices soaked in thickened royal rabri, flavored with cardamom, saffron essence and silver leaf.',
            price: 120,
            dietType: 'Veg',
            isVeg: true,
            tag: 'recommended',
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 120, deliveryFee: 20, discount: 20, rating: 4.8, deliveryTime: 25 },
              { platform: 'Zomato', price: 110, deliveryFee: 15, discount: 20, rating: 4.7, deliveryTime: 22 },
              { platform: 'EatSure', price: 99, deliveryFee: 0, discount: 15, rating: 4.9, deliveryTime: 18 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Punjab Grill',
    cuisine: 'Gourmet North Indian & Traditional Tandoor',
    rating: 4.6,
    deliveryTime: 35,
    bannerImage: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80',
    tagline: 'Rich luxury gravies, hand-pulled butter tandoori breads, and legacy marinades.',
    platforms: ['Zomato', 'Swiggy'],
    menuCategories: [
      {
        name: 'Royal Punjabi curries',
        items: [
          {
            id: 'f_pun_p1',
            name: 'Paneer Butter Masala',
            description: 'Plump paneer cubes simmered in a silky tomato gravy with rich butter, sweet honey and aromatic fresh fenugreek leaves (kasuri methi).',
            price: 280,
            dietType: 'Veg',
            isVeg: true,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 280, deliveryFee: 40, discount: 50, rating: 4.3, deliveryTime: 40 },
              { platform: 'Zomato', price: 270, deliveryFee: 30, discount: 40, rating: 4.3, deliveryTime: 35 }
            ]
          },
          {
            id: 'f_pun_p2',
            name: 'Classic Murgh Makhani',
            description: 'Tandoori grilled chicken shreds tossed in cream-filled sweet tomato butter gravy.',
            price: 340,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'repeated',
            image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 350, deliveryFee: 40, discount: 60, rating: 4.5, deliveryTime: 38 },
              { platform: 'Zomato', price: 330, deliveryFee: 30, discount: 50, rating: 4.5, deliveryTime: 32 }
            ]
          }
        ]
      },
      {
        name: 'Indian Flatbreads',
        items: [
          {
            id: 'f_pun_n1',
            name: 'Premium Garlic Butter Naan',
            description: 'Leavened flatbread brushed with crushed premium garlic cloves and clarified butter.',
            price: 80,
            dietType: 'Veg',
            isVeg: true,
            tag: 'recommended',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 80, deliveryFee: 20, discount: 10, rating: 4.4, deliveryTime: 30 },
              { platform: 'Zomato', price: 75, deliveryFee: 15, discount: 10, rating: 4.4, deliveryTime: 25 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Moti Mahal Delux',
    cuisine: 'Legendary Butter Chicken & Mughlai Classics',
    rating: 4.4,
    deliveryTime: 32,
    bannerImage: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80',
    tagline: 'The pioneers of rich tandoori chicken and creamy sweet butter sauces.',
    platforms: ['Zomato', 'Swiggy'],
    menuCategories: [
      {
        name: 'Butter Roast Delights',
        items: [
          {
            id: 'f_mot_m1',
            name: 'Butter Chicken combo with Naan',
            description: 'Delectable classic boneless butter chicken paired with 2 hot butter tandoori rotis or butter naan.',
            price: 330,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zomato', price: 320, deliveryFee: 25, discount: 80, rating: 4.5, deliveryTime: 32 },
              { platform: 'Swiggy', price: 340, deliveryFee: 45, discount: 100, rating: 4.4, deliveryTime: 38 }
            ]
          },
          {
            id: 'f_mot_m2',
            name: 'Legacy Dal Makhani',
            description: 'Slow slow-cooked black lentils simmered overnight, topped with dairy churning cream.',
            price: 250,
            dietType: 'Veg',
            isVeg: true,
            tag: 'repeated',
            image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zomato', price: 245, deliveryFee: 20, discount: 45, rating: 4.3, deliveryTime: 30 },
              { platform: 'Swiggy', price: 260, deliveryFee: 30, discount: 50, rating: 4.3, deliveryTime: 35 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'La Pinoz Pizza',
    cuisine: 'Visual Giant Pizzas & Cheeseburst Garlic Breads',
    rating: 4.3,
    deliveryTime: 25,
    bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    tagline: 'Hot bubble-crusted Italian specialty pies prepared freshly with mozzarella.',
    platforms: ['Zomato', 'Swiggy'],
    menuCategories: [
      {
        name: 'Gourmet Pizzas',
        items: [
          {
            id: 'f_lap_l1',
            name: 'Veg Loaded Pizza (9 inch)',
            description: 'Golden sweet corn, crisp capsicums, dynamic paneer dices and juicy red onions baked under thick cheese.',
            price: 249,
            dietType: 'Veg',
            isVeg: true,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zomato', price: 249, deliveryFee: 35, discount: 30, rating: 4.1, deliveryTime: 25 },
              { platform: 'Swiggy', price: 259, deliveryFee: 40, discount: 50, rating: 4.1, deliveryTime: 28 }
            ]
          },
          {
            id: 'f_lap_l2',
            name: 'Peri Peri Chicken Supreme Pizza',
            description: 'Hot shredded chicken cubes sprinkled with spice powders on a flat baked dough crust.',
            price: 320,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'recommended',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zomato', price: 310, deliveryFee: 30, discount: 40, rating: 4.2, deliveryTime: 24 },
              { platform: 'Swiggy', price: 329, deliveryFee: 35, discount: 45, rating: 4.2, deliveryTime: 26 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Zepto Cafe',
    cuisine: 'Dynamic Baked Pastries, Fresh Sandwiches & Filter Coffee',
    rating: 4.8,
    deliveryTime: 12,
    bannerImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
    tagline: '10-minute ultra-speed delivery of roasted filter coffees, sub sandwiches and fries.',
    platforms: ['Zepto Cafe'],
    menuCategories: [
      {
        name: 'Cafe Bites',
        items: [
          {
            id: 'f_zep_z1',
            name: 'Peri Peri Crispy Fries',
            description: 'Hot baked potato fingers tossed in spicy South-African Peri-Peri shaking spices.',
            price: 110,
            dietType: 'Veg',
            isVeg: true,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zepto Cafe', price: 110, deliveryFee: 15, discount: 20, rating: 4.2, deliveryTime: 12 }
            ]
          },
          {
            id: 'f_zep_z2',
            name: 'Egg White Chicken Sub Sandwich',
            description: 'Toasted premium multigrain sub sandwich loaded with protein egg whites, smoked chicken chunks, and garlic mayo.',
            price: 149,
            dietType: 'Eggetarian',
            isVeg: false,
            tag: 'recommended',
            image: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Zepto Cafe', price: 149, deliveryFee: 15, discount: 25, rating: 4.7, deliveryTime: 10 }
            ]
          }
        ]
      }
    ]
  }
];

export default function FoodModule({
  cart,
  addToCart,
  removeFromCart,
  preferenceMode,
  defaultFoodOrder,
  defaultFoodType
}: FoodModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Biryani', 'Cheese Pizza', 'Garlic Bread']);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Diet filter state
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Eggetarian'>('All');
  const [selectedRestaurant, setSelectedRestaurant] = useState<DetailedRestaurant | null>(null);

  // Compare Panel state variables
  const [focusedDishId, setFocusedDishId] = useState<string | null>(null);

  // Additional Filter and Sort states for Food module
  const [foodSortBy, setFoodSortBy] = useState<'rating' | 'cost_asc' | 'time'>('rating');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
  };

  // Helper to calculate cost comparison for dishes
  const getNetPriceForDeal = (deal: { price: number; deliveryFee: number; discount: number }) => {
    return deal.price + deal.deliveryFee - deal.discount;
  };

  // Helper inside detail screen to locate standard FoodItem model structure to add/remove to cart props
  const buildFoodModel = (dish: any, chosenDeal: any): FoodItem => {
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
  };

  const getCartQty = (dishId: string, platform: string) => {
    const matched = cart.foodItems.find(fi => fi.item.id === dishId && fi.item.platform === platform);
    return matched ? matched.quantity : 0;
  };

  const getDishCombinedCartQty = (dishId: string) => {
    let tot = 0;
    cart.foodItems.forEach(fi => {
      if (fi.item.id === dishId) {
        tot += fi.quantity;
      }
    });
    return tot;
  };

  const getActivePlatformInCart = (dishId: string) => {
    const matched = cart.foodItems.find(fi => fi.item.id === dishId);
    return matched ? matched.item.platform : null;
  };

  return (
    <div id="food_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      
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
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Outlets</span>
        </button>
      )}

      {/* RENDER DUAL VIEW: RESTAURANTS LIST VIEW vs SELECTED DETAIL VIEW */}
      {!selectedRestaurant ? (
        <>
          {/* Global Unified Search with easy bubble triggers */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-white p-2.5 rounded-2xl border border-gray-150 shadow-xs focus-within:border-rose-400 transition-all">
              <Search className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchQuery);
                  }
                }}
                placeholder="Search Biryani, Butter Chicken, Pizzas, Cafe Coffee..."
                id="food_search_input"
                className="w-full text-xs outline-none font-medium placeholder-gray-400"
              />
              {(searchQuery || searchFocused) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchFocused(false);
                  }}
                  className="text-gray-500 hover:text-gray-800 text-[10px] font-extrabold px-1 font-mono uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recent Searches Panel */}
            {searchFocused && (
              <div className="bg-rose-50/55 rounded-2xl border border-rose-100 p-3 space-y-2.5 animate-in fade-in duration-250">
                {recentSearches.length > 0 && (
                  <div>
                    <span className="text-[8px] font-black text-rose-800 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Searches</span>
                    <div className="flex flex-wrap gap-1">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSearchSubmit(term)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[10px] font-bold text-gray-750 border border-rose-100 rounded-lg cursor-pointer transition"
                        >
                          🍔 {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest block mb-1 font-mono">🔥 Trending Suggestions</span>
                  <div className="flex flex-wrap gap-1">
                    {['Biryani Deal 🍱', 'Paneer Butter 🧀', 'Loaded Pizza 🍕', 'Fries 🍟', 'Zepto Cafe ☕'].map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSearchSubmit(term.replace(/ [^ ]+$/, ''))}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[10px] font-extrabold text-amber-900 border border-gray-150 rounded-lg cursor-pointer transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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

          {/* DIET, CUISINE SELECTION, AND SORTING OPTIONS FOR MAIN DIRECTORY */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                <span>Filters & Sort Options</span>
              </span>
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-mono font-bold">
                Multi-Platform Real-time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Diet selection */}
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">Diet Preference</label>
                <div className="flex bg-white rounded-xl border border-slate-200 p-0.5">
                  {(['All', 'Veg', 'Non-Veg'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setDietFilter(pref as any)}
                      className={`flex-1 text-center py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                        dietFilter === pref
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {pref === 'Veg' ? '🟢 Veg' : pref === 'Non-Veg' ? '🔴 Non-Veg' : '🍽️ All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine selection */}
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">Cuisine Type</label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-[11px] px-2.5 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="All">All Cuisines</option>
                  <option value="South Indian">South Indian</option>
                  <option value="North Indian">North Indian</option>
                  <option value="Pizza">Pizzas & Fast Food</option>
                  <option value="Desserts">Sweet Treats & Coffee</option>
                </select>
              </div>

              {/* Sort selector */}
              <div>
                <label className="block text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">Sort Outlets By</label>
                <select
                  value={foodSortBy}
                  onChange={(e) => setFoodSortBy(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-[11px] px-2.5 py-1.5 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="rating">★ Highest Ratings</option>
                  <option value="cost_asc">₹ Price: Low to High</option>
                  <option value="time">⚡ Delivery: Fastest first</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIST OF RESTAURANTS GRID */}
          <div className="space-y-3.5">
            <div className="flex items-center space-x-1 text-slate-800">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Listed Outlets & Kitchens</span>
            </div>

            {[...DETAILED_RESTAURANTS].filter(outlet => {
              // Main page search filter
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesOutlet = outlet.name.toLowerCase().includes(q) || outlet.cuisine.toLowerCase().includes(q);
                // Also check if matches any menu item name
                const matchesAnyItem = outlet.menuCategories.some(cat => 
                  cat.items.some(it => it.name.toLowerCase().includes(q))
                );
                if (!matchesOutlet && !matchesAnyItem) return false;
              }

              // Main page diet filter check
              if (dietFilter !== 'All') {
                const hasMatchingDietItem = outlet.menuCategories.some(cat => 
                  cat.items.some(it => it.dietType === dietFilter)
                );
                if (!hasMatchingDietItem) return false;
              }

              // Cuisine filter check
              if (selectedCuisine !== 'All') {
                const matchesCuisine = outlet.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
                if (!matchesCuisine) return false;
              }

              return true;
            }).sort((a, b) => {
              if (foodSortBy === 'rating') return b.rating - a.rating;
              if (foodSortBy === 'time') return a.deliveryTime - b.deliveryTime;
              if (foodSortBy === 'cost_asc') return (a.menuCategories[0]?.items[0]?.price || 0) - (b.menuCategories[0]?.items[0]?.price || 0);
              return 0;
            }).map(outlet => (
              <div
                key={outlet.name}
                onClick={() => setSelectedRestaurant(outlet)}
                className="bg-white rounded-3xl border border-gray-150 hover:border-rose-400 hover:shadow-md transition-all p-3.5 flex flex-col sm:flex-row gap-4.5 cursor-pointer shadow-xs relative"
              >
                {/* Banner Photo */}
                <div className="relative w-full sm:w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={outlet.bannerImage}
                    alt={outlet.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center bg-white/95 px-1.5 py-0.5 rounded-lg border border-gray-150 shadow-xs">
                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 mr-1 shrink-0" />
                    <span className="text-[9.5px] font-mono font-black text-gray-800 leading-none">{outlet.rating}</span>
                  </div>
                </div>

                {/* Info block */}
                <div className="flex-1 flex flex-col justify-between py-0.5 space-y-2">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-display font-black text-gray-950 tracking-tight leading-tight">{outlet.name}</h3>
                      <div className="flex items-center space-x-1.5">
                        {outlet.platforms.map(p => (
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
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{outlet.cuisine}</p>
                    <p className="text-[10px] text-gray-400 italic font-sans truncate pr-5 mt-1">"{outlet.tagline}"</p>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] font-mono pt-2 border-t border-dotted border-gray-150 text-slate-500">
                    <span className="font-semibold block">🕒 ~{outlet.deliveryTime} mins arrival</span>
                    <span className="text-rose-600 font-extrabold flex items-center text-[10px] uppercase tracking-wider">
                      View Menu <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* RENDER SELECTED RESTAURANT DETAILED VIEW MODE */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Restaurant Header Banner Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-xs relative">
            <div className="h-32 w-full relative bg-slate-100">
              <img 
                src={selectedRestaurant.bannerImage} 
                alt={selectedRestaurant.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[8.5px] bg-rose-600 text-white font-extrabold font-mono tracking-widest px-2 py-0.5 rounded-md uppercase">Verified kitchen</span>
                <h3 className="text-lg font-display font-black tracking-tight leading-none text-white mt-1.5">{selectedRestaurant.name}</h3>
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{selectedRestaurant.cuisine}</p>
              <p className="text-xs text-gray-400 leading-normal italic font-medium">"{selectedRestaurant.tagline}"</p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2 border-t border-gray-100 text-[10px] font-mono text-gray-500">
                <span className="bg-amber-50 text-amber-800 font-extrabold px-2 py-0.5 rounded flex items-center">
                  ★ {selectedRestaurant.rating} (Superb)
                </span>
                <span>•</span>
                <span className="text-slate-600 font-bold block">🏠 Instantly serves across: {selectedRestaurant.platforms.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* LOCAL DIET FILTERS FOR ACTIVE MENU */}
          <div className="flex items-center justify-between pb-1 bg-white p-2.5 rounded-2xl border border-gray-150">
            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Menu Filter</span>
            </div>

            <div className="flex space-x-1 overflow-x-auto scrollbar-none items-center">
              <span className="px-2.5 py-1 rounded-lg text-[9.5px] font-black bg-rose-500 text-white font-mono">🔴 NON-VEG DIET ENFORCED</span>
            </div>
          </div>

          {/* SECTION A: BEST, REPEATED & RECOMMENDED ORDER ITEMS ON TOP */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center space-x-1.5 text-slate-800 pl-0.5">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Best sellers & Chef Picks</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(() => {
                // Flatten and extract items that are tagged
                const taggedItems: any[] = [];
                selectedRestaurant.menuCategories.forEach(cat => {
                  cat.items.forEach(it => {
                    if (it.tag && (dietFilter === 'All' || it.dietType === dietFilter)) {
                      taggedItems.push(it);
                    }
                  });
                });

                if (taggedItems.length === 0) {
                  return (
                    <div className="col-span-2 text-center p-4 bg-gray-50 rounded-2xl border border-dashed text-gray-400 text-xs font-semibold">
                      No matching promotional dishes for this diet preference.
                    </div>
                  );
                }

                // Render tagged dishes in a beautiful premium visual card format
                return taggedItems.map(dish => {
                  // Find cheapest platform price
                  const cheapestDeal = [...dish.platformDeals].sort((a, b) => getNetPriceForDeal(a) - getNetPriceForDeal(b))[0];
                  const standardNetPrice = getNetPriceForDeal(cheapestDeal);

                  return (
                    <div 
                      key={`top-${dish.id}`}
                      onClick={() => setFocusedDishId(dish.id === focusedDishId ? null : dish.id)}
                      className={`bg-white rounded-3xl p-3.5 border transition-all cursor-pointer relative shadow-sm hover:border-amber-400 flex flex-col justify-between h-44 ${
                        focusedDishId === dish.id ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-150'
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
                          <span className="text-sm font-black text-slate-900 font-mono">₹{standardNetPrice}</span>
                        </div>
                        <div className="bg-rose-50/70 border border-rose-200 text-rose-600 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider block shrink-0">
                          {getDishCombinedCartQty(dish.id) > 0 ? `In Cart (${getDishCombinedCartQty(dish.id)})` : 'Add +'}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* SECTION B: MENU LISTING GROUPED CATEGORY-WISE */}
          <div className="space-y-5">
            <div className="flex items-center space-x-1.5 text-slate-800 pl-0.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Category Wise Menu Catalog</span>
            </div>

            {selectedRestaurant.menuCategories.map(category => {
              // Filter items inside category
              const matchedCategoryItems = category.items.filter(it => 
                dietFilter === 'All' || it.dietType === dietFilter
              );

              if (matchedCategoryItems.length === 0) return null;

              return (
                <div key={category.name} className="space-y-2.5">
                  <h4 className="text-[11px] font-black uppercase text-rose-850 tracking-wider bg-rose-50/50 px-3 py-1 rounded-lg w-fit border border-rose-100/60 font-mono">
                    ✦ {category.name} ({matchedCategoryItems.length})
                  </h4>

                  <div className="space-y-3">
                    {matchedCategoryItems.map(dish => {
                      const cheapestDeal = [...dish.platformDeals].sort((a, b) => getNetPriceForDeal(a) - getNetPriceForDeal(b))[0];
                      const chosenPlatform = getActivePlatformInCart(dish.id) || cheapestDeal.platform;
                      const activeDeal = dish.platformDeals.find(d => d.platform === chosenPlatform) || cheapestDeal;

                      const netPrice = getNetPriceForDeal(activeDeal);
                      const qty = getCartQty(dish.id, activeDeal.platform);
                      const combinedQty = getDishCombinedCartQty(dish.id);
                      const isFocused = focusedDishId === dish.id;

                      return (
                        <div
                          key={dish.id}
                          className={`bg-white rounded-3xl border transition-all p-3.5 flex flex-col relative gap-3.5 ${
                            isFocused 
                              ? 'border-rose-450 shadow-md ring-1 ring-rose-300/35' 
                              : 'border-gray-150 hover:border-gray-300'
                          }`}
                        >
                          {/* Inner Dish Row */}
                          <div 
                            onClick={() => setFocusedDishId(isFocused ? null : dish.id)}
                            className="flex gap-3.5 cursor-pointer"
                          >
                            <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-50">
                              <img referrerPolicy="no-referrer" src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                              
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
                                <span className="text-slate-500 font-bold">Via default platform: <b className="text-rose-600 uppercase font-black">{activeDeal.platform}</b></span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive pricing row */}
                          <div className="flex items-end justify-between pt-2.5 border-t border-dotted border-gray-150 font-mono">
                            <div>
                              <div className="flex items-baseline space-x-1.5">
                                <span className="text-sm font-black text-slate-950">₹{netPrice}</span>
                                <span className="text-[10.5px] text-gray-400 line-through">₹{activeDeal.price}</span>
                              </div>
                              <span className="text-[8.5px] text-gray-400 block font-sans">Menu ₹{activeDeal.price} + Fee ₹{activeDeal.deliveryFee} - Off ₹{activeDeal.discount}</span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setFocusedDishId(isFocused ? null : dish.id)}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-xl text-[9px] font-black uppercase tracking-wider block border border-rose-100 cursor-pointer text-center"
                              >
                                {isFocused ? 'Close Compare' : 'Compare Platform Deals ⚖'}
                              </button>

                              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 p-0.5 rounded-xl shrink-0">
                                {qty > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(buildFoodModel(dish, activeDeal))}
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
                                  onClick={() => addToCart(buildFoodModel(dish, activeDeal))}
                                  className="p-1 px-2.2 hover:bg-rose-500 hover:text-white text-rose-600 bg-rose-50 rounded-lg transition font-black text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* SECTION C: "only when i select or add it" CROSS PLATFORM COMPARATIVE PRICE TRACER */}
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
                                    const isInCartDealt = getCartQty(dish.id, deal.platform);

                                    return (
                                      <div 
                                        key={deal.platform}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                          isLowest 
                                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' 
                                            : 'bg-white/5 border-white/5 text-gray-200'
                                        }`}
                                      >
                                        <div className="min-w-0">
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
                                                onClick={() => removeFromCart(buildFoodModel(dish, deal))}
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
                                                addToCart(buildFoodModel(dish, deal));
                                                alert(`✨ Direct addition successful! Added "${dish.name}" from ${deal.platform} to your checkout cart at the guaranteed rate of ₹${combinedNetCost}.`);
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
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Cart Sticky Notification */}
      {cart.foodItems.length > 0 && (
        <div className="bg-rose-950 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-rose-800 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-rose-200" />
            </div>
            <div>
              <span className="text-xs font-bold block">{cart.foodItems.length} unique food items in list</span>
              <span className="text-[10px] text-rose-300">Total items: {cart.foodItems.reduce((acc, x) => acc + x.quantity, 0)} items added</span>
            </div>
          </div>
          <span className="text-sm font-extrabold font-mono bg-rose-800 px-3 py-1 rounded">
            Check Cart
          </span>
        </div>
      )}
    </div>
  );
}
