import { auth } from '../../firebase';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FoodServiceInstance } from '../../services/food/FoodService';
import { FoodItem, UnifiedCart } from '../../types';

export interface DetailedRestaurant {
  id: string;
  name: string;
  cuisine: string;
  cuisines?: string[];
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
      price: number;
      dietType: 'Veg' | 'Non-Veg' | 'Eggetarian';
      isVeg: boolean;
      tag?: 'best' | 'repeated' | 'recommended';
      image: string;
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

interface FoodContextType {
  restaurants: DetailedRestaurant[];
  selectedRestaurant: DetailedRestaurant | null;
  setSelectedRestaurant: (restaurant: DetailedRestaurant | null) => void;
  dietFilter: 'All' | 'Veg' | 'Non-Veg' | 'Eggetarian';
  setDietFilter: (filter: 'All' | 'Veg' | 'Non-Veg' | 'Eggetarian') => void;
  selectedCuisine: string;
  setSelectedCuisine: (cuisine: string) => void;
  localPreferenceMode: string;
  setLocalPreferenceMode: (mode: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;
  searchFocused: boolean;
  setSearchFocused: (focused: boolean) => void;
  recentSearches: string[];
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>;
  favorites: string[];
  toggleFavorite: (restaurantId: string) => Promise<void>;
  focusedDishId: string | null;
  setFocusedDishId: (dishId: string | null) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreRestaurants: () => Promise<void>;
  fetchRestaurants: (reset?: boolean) => Promise<void>;
  cart: UnifiedCart;
  addToCart: (item: FoodItem) => void;
  removeFromCart: (item: FoodItem) => void;
  preferenceMode: string;
  defaultFoodOrder: string[];
  defaultFoodType?: string;
  setActiveTab?: (tab: string) => void;
  connectedAccounts?: any;
  currentSelectedLocation?: string;
  redirectToLinkedAccounts?: () => void;
  onBackRegister?: (handler: (() => boolean) | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  availableCoupons: any[];
  activeCoupon: any | null;
  setActiveCoupon: (coupon: any | null) => void;
  customizationDish: any | null;
  setCustomizationDish: (dish: any | null) => void;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export const FoodProvider: React.FC<{
  children: React.ReactNode;
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
}> = ({
  children,
  cart,
  addToCart,
  removeFromCart,
  preferenceMode,
  defaultFoodOrder,
  defaultFoodType,
  setActiveTab,
  connectedAccounts,
  currentSelectedLocation,
  redirectToLinkedAccounts,
  onBackRegister
}) => {
  const [restaurants, setRestaurants] = useState<DetailedRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurantState] = useState<DetailedRestaurant | null>(null);
  
  // Filters & Search
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Eggetarian'>('All');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [localPreferenceMode, setLocalPreferenceMode] = useState<string>(preferenceMode || 'cheapest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Biryani', 'Cheese Pizza', 'Garlic Bread']);
  
  // Custom states
  const [favorites, setFavorites] = useState<string[]>([]);
  const [focusedDishId, setFocusedDishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  // CartDrawer, CustomizationModal & CouponSection
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<any | null>(null);
  const [customizationDish, setCustomizationDish] = useState<any | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load search history & favorites on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const searches = await FoodServiceInstance.getSearchHistory(auth?.currentUser?.uid || 'guest');
        if (searches.length > 0) {
          setRecentSearches(searches.map((s: any) => s.term).slice(0, 5));
        }
        const favs = await FoodServiceInstance.getFavorites(auth?.currentUser?.uid || 'guest');
        setFavorites(favs);
        
        // Fetch coupons
        const couponsList = await FoodServiceInstance.getCoupons();
        setAvailableCoupons(couponsList);
      } catch (err) {
        console.error('Error loading initial food user data:', err);
      }
    };
    loadUserData();
  }, []);

  // Save search query to history on debounce finish
  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 2) {
      try {
        FoodServiceInstance.saveSearchHistory(auth?.currentUser?.uid || 'guest', debouncedSearchQuery);
      } catch (err) {
        console.error('Error saving search history:', err);
      }
    }
  }, [debouncedSearchQuery]);

  // Fetch Restaurants page 1
  const fetchRestaurants = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const activeFilters = {
        diet: dietFilter,
        cuisine: selectedCuisine,
        sort: localPreferenceMode
      };

      const startCursor = reset ? null : lastDoc;
      const result = await FoodServiceInstance.getRestaurants(activeFilters, startCursor, 10);
      
      // For each restaurant, let's load its menu Categories asynchronously and merge it
      const detailedList = await Promise.all(
        result.restaurants.map(async (r: any) => {
          const menuCategories = await FoodServiceInstance.getRestaurantMenu(r.id);
          return {
            ...r,
            menuCategories
          };
        })
      );

      if (reset) {
        setRestaurants(detailedList as DetailedRestaurant[]);
      } else {
        setRestaurants(prev => [...prev, ...(detailedList as DetailedRestaurant[])]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.restaurants.length === 10);
    } catch (err) {
      console.error('Error loading restaurants:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [dietFilter, selectedCuisine, localPreferenceMode, lastDoc]);

  // Trigger load on filter change
  useEffect(() => {
    fetchRestaurants(true);
  }, [dietFilter, selectedCuisine, localPreferenceMode]);

  // Infinite Scroll Trigger handler
  const loadMoreRestaurants = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchRestaurants(false);
  }, [loadingMore, hasMore, fetchRestaurants]);

  // Custom back handler syncing
  useEffect(() => {
    if (onBackRegister) {
      if (selectedRestaurant) {
        onBackRegister(() => {
          setSelectedRestaurantState(null);
          setFocusedDishId(null);
          return true;
        });
      } else {
        onBackRegister(null);
      }
    }
    return () => {
      if (onBackRegister) onBackRegister(null);
    };
  }, [selectedRestaurant, onBackRegister]);

  // Sync preferenceMode prop with local state
  useEffect(() => {
    if (preferenceMode) {
      setLocalPreferenceMode(preferenceMode);
    }
  }, [preferenceMode]);

  // Toggle favorite handler
  const handleToggleFavorite = useCallback(async (restaurantId: string) => {
    try {
      const isCurrentlyFav = favorites.includes(restaurantId);
      await FoodServiceInstance.toggleFavorite(auth?.currentUser?.uid || 'guest', restaurantId, !isCurrentlyFav);
      setFavorites(prev => 
        isCurrentlyFav ? prev.filter(id => id !== restaurantId) : [...prev, restaurantId]
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [favorites]);

  const setSelectedRestaurant = useCallback((restaurant: DetailedRestaurant | null) => {
    setSelectedRestaurantState(restaurant);
    // Reset comparison active dish on switching restaurant
    setFocusedDishId(null);
  }, []);

  const value = useMemo(() => ({
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    dietFilter,
    setDietFilter,
    selectedCuisine,
    setSelectedCuisine,
    localPreferenceMode,
    setLocalPreferenceMode,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    searchFocused,
    setSearchFocused,
    recentSearches,
    setRecentSearches,
    favorites,
    toggleFavorite: handleToggleFavorite,
    focusedDishId,
    setFocusedDishId,
    loading,
    loadingMore,
    hasMore,
    loadMoreRestaurants,
    fetchRestaurants,
    cart,
    addToCart,
    removeFromCart,
    preferenceMode,
    defaultFoodOrder,
    defaultFoodType,
    setActiveTab,
    connectedAccounts,
    currentSelectedLocation,
    redirectToLinkedAccounts,
    onBackRegister,
    isCartOpen,
    setIsCartOpen,
    availableCoupons,
    activeCoupon,
    setActiveCoupon,
    customizationDish,
    setCustomizationDish
  }), [
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    dietFilter,
    selectedCuisine,
    localPreferenceMode,
    searchQuery,
    debouncedSearchQuery,
    searchFocused,
    recentSearches,
    favorites,
    handleToggleFavorite,
    focusedDishId,
    loading,
    loadingMore,
    hasMore,
    loadMoreRestaurants,
    fetchRestaurants,
    cart,
    addToCart,
    removeFromCart,
    preferenceMode,
    defaultFoodOrder,
    defaultFoodType,
    setActiveTab,
    connectedAccounts,
    currentSelectedLocation,
    redirectToLinkedAccounts,
    onBackRegister,
    isCartOpen,
    availableCoupons,
    activeCoupon,
    customizationDish
  ]);

  return (
    <FoodContext.Provider value={value}>
      {children}
    </FoodContext.Provider>
  );
};

export const useFood = () => {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
};
