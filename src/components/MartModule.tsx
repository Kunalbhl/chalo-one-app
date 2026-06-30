import React, { useState, useEffect } from 'react';
import { MART_ITEMS } from '../data';
import { MartItem, UnifiedCart } from '../types';
import { Search, ShoppingCart, Zap, Star, ShieldAlert, Heart, RefreshCw, BookmarkCheck, ArrowRight, SlidersHorizontal } from 'lucide-react';

interface MartModuleProps {
  cart: UnifiedCart;
  addMartToCart: (item: MartItem, platform: string) => void;
  removeMartFromCart: (item: MartItem, platform: string) => void;
  preferenceMode: string;
  defaultFoodType?: 'Veg' | 'Non-Veg' | 'Eggetarian' | "Doesn't Matter";
  setActiveTab?: (tab: string) => void;
  connectedAccounts?: any;
  currentSelectedLocation?: string;
}

export default function MartModule({
  cart,
  addMartToCart,
  removeMartFromCart,
  preferenceMode,
  defaultFoodType,
  setActiveTab,
  connectedAccounts,
  currentSelectedLocation
}: MartModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Organic Milk', 'Brown Bread', 'Amul Butter']);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Dairy & Eggs' | 'Bakery' | 'Snacks' | 'Staples' | 'Household'>('All');
  
  // Configure initial diet state based on primary account preference selection
  const getInitialDiet = (): 'All' | 'Veg' | 'Non-Veg' | 'Eggetarian' => {
    if (!defaultFoodType || defaultFoodType === "Doesn't Matter") return 'All';
    return defaultFoodType;
  };
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Eggetarian'>(getInitialDiet());

  // Interactive local sorting preference state
  const [localPreferenceMode, setLocalPreferenceMode] = useState<string>(preferenceMode || 'cheapest');
  const [showLinkBanner, setShowLinkBanner] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  // Sync preferenceMode prop with local state
  useEffect(() => {
    if (preferenceMode) {
      setLocalPreferenceMode(preferenceMode);
    }
  }, [preferenceMode]);

  const [savedLists, setSavedLists] = useState<string[]>([
    "Weekly Breakfast Essentials",
    "Monthly Staples Stock",
    "Weekend Snack Box"
  ]);

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    setSearchFocused(false);
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== val.toLowerCase());
      return [val, ...filtered].slice(0, 5);
    });
  };

  // Handle filter items with advanced multi-platform sort
  let filteredProducts = MART_ITEMS.filter(item => {
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    
    let matchesDiet = true;
    if (dietFilter !== 'All') {
      matchesDiet = item.dietType === dietFilter;
    }

    const matchesBrand = selectedBrand === 'All' || item.brand === selectedBrand;
    
    return matchesSearch && matchesCat && matchesDiet && matchesBrand;
  });

  // Dynamic search fallback item generator
  if (searchQuery.trim() !== '' && filteredProducts.length === 0) {
    const cleanQuery = searchQuery.trim();
    const capitalizedName = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);
    
    filteredProducts = [
      {
        id: `dynamic-${cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: `${capitalizedName} (Fresh Pack)`,
        brand: 'Chalo Fresh',
        weightVolume: '1 Unit / Pack',
        category: activeCategory !== 'All' ? activeCategory : 'Staples',
        dietType: dietFilter !== 'All' ? dietFilter : 'Veg',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        prices: [
          { platform: 'Blinkit', price: 90, discountedPrice: 79, deliveryTime: 9, inStock: true },
          { platform: 'Zepto', price: 95, discountedPrice: 75, deliveryTime: 8, inStock: true },
          { platform: 'Instamart', price: 89, discountedPrice: 78, deliveryTime: 11, inStock: true },
          { platform: 'JioMart', price: 85, discountedPrice: 70, deliveryTime: 40, inStock: true }
        ]
      }
    ];
  }

  filteredProducts.sort((a, b) => {
    // Helpers to find min price and delivery times across platforms
    const getMinPrice = (item: MartItem) => {
      const inStockPrices = item.prices.filter(p => p.inStock);
      if (inStockPrices.length === 0) return 99999;
      return Math.min(...inStockPrices.map(p => p.discountedPrice));
    };

    const getMinDelivery = (item: MartItem) => {
      const inStockPrices = item.prices.filter(p => p.inStock);
      if (inStockPrices.length === 0) return 99999;
      return Math.min(...inStockPrices.map(p => p.deliveryTime));
    };

    if (localPreferenceMode === 'cheapest') {
      return getMinPrice(a) - getMinPrice(b);
    } else if (localPreferenceMode === 'fastest') {
      return getMinDelivery(a) - getMinDelivery(b);
    } else if (localPreferenceMode === 'rated') {
      // Sort by price or default since item-level rating is not explicitly in mock schema
      return getMinPrice(a) - getMinPrice(b);
    } else {
      return 0; // default
    }
  });

  const getQuantItemInCart = (id: string, platform: string) => {
    const existing = cart.martItems.find(mi => mi.item.id === id && mi.platform === platform);
    return existing ? existing.quantity : 0;
  };

  // Reorder instant triggers
  const handleSmartReorder = (listName: string) => {
    // Adds milk and bread to cart from Blinkit automatically
    const milk = MART_ITEMS.find(m => m.id === 'm1');
    const bread = MART_ITEMS.find(m => m.id === 'm2');
    if (milk) addMartToCart(milk, 'Blinkit');
    if (bread) addMartToCart(bread, 'Blinkit');

    alert(`⚡ Smart Reorder Triggered! "${listName}" items (Amul Milk, Harvest Gold Bread) have been dynamically calculated and added to your Cart via Blinkit!`);
  };

  return (
    <div id="mart_module_container" className="p-4 max-w-xl mx-auto space-y-4 font-sans text-gray-800">
      <div className="flex items-center space-x-2 pb-2">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight text-emerald-950">Chalo Mart price check</h2>
          <p className="text-xs text-gray-500">Side-by-side grocery comparisons: Blinkit, Zepto, Instamart, JioMart</p>
        </div>
      </div>

      {showLinkBanner && (!connectedAccounts || (!connectedAccounts.blinkit && !connectedAccounts.zepto && !connectedAccounts.instamart)) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium font-sans">
          <div className="flex items-center space-x-2">
            <span className="text-base shrink-0">💡</span>
            <span>Link your Blinkit, Zepto, and Instamart accounts to sync active Passes, loyalty coins, and unlock waived delivery fees!</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              type="button" 
              onClick={() => { if (setActiveTab) setActiveTab('account'); }} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
            >
              Link Account
            </button>
            <button 
              type="button" 
              onClick={() => setShowLinkBanner(false)} 
              className="text-emerald-500 hover:text-emerald-700 text-xs font-bold px-1.5 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modern Search bar */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-gray-150 shadow-xs focus-within:border-emerald-400 transition-all">
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
            placeholder="Search milk, bread, cooking oil, detergent..."
            id="mart_search_input"
            className="w-full text-xs outline-none font-medium placeholder-gray-400"
          />
          {(searchQuery || searchFocused) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchFocused(false);
              }}
              className="text-[10px] text-gray-400 hover:text-gray-700 font-bold uppercase transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic focus overlay for Mart searches */}
        {searchFocused && (
          <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-3 space-y-2.5">
            {recentSearches.length > 0 && (
              <div>
                <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest block mb-1 font-mono">⏰ Recent Grocery Searches</span>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSearchSubmit(term)}
                      className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-[10px] font-bold text-gray-700 border border-emerald-100 rounded-lg cursor-pointer transition"
                    >
                      🥛 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest block mb-1 font-mono">🔥 Trending items:</span>
              <div className="flex flex-wrap gap-1">
                {['Farm eggs 🍳', 'Butter 🧈', 'Atta 🌾', 'Potato Chips Chocolate 🍫', 'Detergent 🧼'].map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSearchSubmit(term.replace(/ [^ ]+$/, ''))}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-[10px] font-semibold text-indigo-900 border border-gray-150 rounded-lg cursor-pointer transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick chip categories */}
        <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
          {(['All', 'Dairy & Eggs', 'Bakery', 'Snacks', 'Staples', 'Household'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters & Sort Panel */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Filters & Sort Options</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold font-mono">App Preference Synced</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Diet choice */}
            <div>
              <span className="block text-[8px] text-gray-400 font-bold uppercase mb-1 font-mono">Diet Type</span>
              <select
                value={dietFilter}
                onChange={(e) => setDietFilter(e.target.value as any)}
                className="w-full bg-white border border-gray-200 text-xs px-2.5 py-1.5 rounded-xl text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-550 cursor-pointer"
              >
                <option value="All">🍽 All Diets</option>
                <option value="Veg">🟢 Pure Veg</option>
                <option value="Eggetarian">🟡 Eggetarian</option>
                <option value="Non-Veg">🔴 Non-Veg</option>
              </select>
            </div>

            {/* Brand filter */}
            <div>
              <span className="block text-[8px] text-gray-400 font-bold uppercase mb-1 font-mono">Brand Filter</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-white border border-gray-200 text-xs px-2.5 py-1.5 rounded-xl text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-550 cursor-pointer"
              >
                <option value="All">All Brands</option>
                <option value="Amul">Amul</option>
                <option value="Harvest Gold">Harvest Gold</option>
                <option value="Britannia">Britannia</option>
                <option value="Lay's">Lay's</option>
                <option value="Haldiram's">Haldiram's</option>
                <option value="Surf Excel">Surf Excel</option>
                <option value="Lizol">Lizol</option>
              </select>
            </div>
          </div>

          {/* Interactive Sort Row */}
          <div>
            <span className="block text-[8px] text-slate-455 font-black uppercase mb-1 font-mono">Sort Options</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { val: 'cheapest', label: '💰 Cheapest First' },
                { val: 'fastest', label: '⚡ Fastest Duration' },
                { val: 'rated', label: '⭐ Highest Rating' },
                { val: 'ai', label: '🧠 Smart Recommended' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setLocalPreferenceMode(opt.val)}
                  className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold border transition text-center cursor-pointer ${
                    localPreferenceMode === opt.val
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Saved lists & repeat order sidebar/widget */}
      {!searchQuery.trim() && (
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
          <div className="flex items-center space-x-1">
            <BookmarkCheck className="w-4.5 h-4.5 text-emerald-700" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Repeat Orders & Saved Lists</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            {savedLists.map((listName, i) => (
              <div key={i} className="bg-white p-2.5 rounded-xl border border-emerald-150 flex flex-col justify-between space-y-2">
                <span className="text-[11px] font-bold text-gray-800 leading-tight block">{listName}</span>
                <button
                  type="button"
                  onClick={() => handleSmartReorder(listName)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-1 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-100" />
                  <span>Quick Reorder</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products list detail */}
      <div className="space-y-4">
        {searchQuery.trim() !== '' && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex justify-between items-center text-xs text-emerald-900 font-bold font-sans">
            <span className="flex items-center space-x-1.5">
              <span>🔍</span>
              <span>Showing search results for "{searchQuery}"</span>
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg text-[10px]">
              {filteredProducts.length} items found
            </span>
          </div>
        )}

        {filteredProducts.map(product => {
          // Sort quotes according to preference
          let quotes = [...product.prices];
          if (preferenceMode === 'cheapest') {
            quotes.sort((a,b) => a.discountedPrice - b.discountedPrice);
          } else if (preferenceMode === 'fastest') {
            quotes.sort((a,b) => a.deliveryTime - b.deliveryTime);
          }

          const absoluteCheapest = [...quotes].sort((a,b) => a.discountedPrice - b.discountedPrice)[0];

          return (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs space-y-3.5">
              <div className="flex items-start space-x-3.5 pb-2.5 border-b border-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider font-mono">{product.brand} • {product.category}</span>
                  <h3 className="text-sm font-extrabold text-gray-950 font-display leading-snug">{product.name}</h3>
                  <span className="text-xs text-gray-400 font-medium font-mono">Volume/Size: {product.weightVolume}</span>
                </div>
              </div>

              {/* Side-by-side comparative rates table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono pl-0.5">Brand-wise comparison</span>
                <div className="space-y-1.5">
                  {quotes.map(quote => {
                    const qty = getQuantItemInCart(product.id, quote.platform);
                    const isLowest = quote.discountedPrice === absoluteCheapest.discountedPrice;
                    return (
                      <div
                        key={quote.platform}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          !quote.inStock 
                            ? 'bg-gray-50 border-gray-100 opacity-60' 
                            : isLowest 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-white border-gray-150'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold ${quote.platform === 'Blinkit' ? 'text-amber-600' : 'text-purple-600'}`}>{quote.platform}</span>
                          {isLowest && quote.inStock && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 rounded uppercase">Lowest Plan</span>
                          )}
                          {!quote.inStock && (
                            <span className="text-[9px] bg-gray-150 text-gray-500 font-bold px-1.5 rounded">Out of Stock</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right font-mono">
                            <span className="text-xs text-gray-400 block text-[9px]">Arrives in {quote.deliveryTime} mins</span>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-xs font-bold text-gray-950">₹{quote.discountedPrice}</span>
                              <span className="text-[10px] text-gray-400 line-through">₹{quote.price}</span>
                            </div>
                          </div>

                          {/* ADD subtract cart controllers only if in stock */}
                          {quote.inStock ? (
                            <div className="flex items-center space-x-1 shrink-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden leading-none">
                              {qty > 0 ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => removeMartFromCart(product, quote.platform)}
                                    className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 text-xs font-extrabold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-mono font-extrabold text-emerald-700 px-1">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => addMartToCart(product, quote.platform)}
                                    className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 text-xs font-extrabold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addMartToCart(product, quote.platform)}
                                  className="px-2.5 py-1 text-emerald-600 font-bold text-xs hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                                >
                                  ADD
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-bold pr-2">🚫 N/A</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
