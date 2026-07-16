import { db, auth } from '../../firebase';
import { OfflineCacheInstance, AnalyticsInstance } from './EnterpriseFoodServices';
import {
  collection, doc, getDocs, getDoc, query, where, orderBy, 
  limit, startAfter, setDoc, updateDoc, serverTimestamp, arrayUnion 
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const code = (error as any)?.code || 'unknown';
  const msg = (error as any)?.message || String(error);
  console.error(`Firestore Error [${code}]: ${msg}`, JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CacheEntry<T> {
  data: T;
  ts: number;
  refreshing?: boolean;
}

export class FoodService {
  private static instance: FoodService;
  
  private constructor() {}
  
  private restaurantCache: Map<string, CacheEntry<any>> = new Map();
  private menuCache: Map<string, CacheEntry<any>> = new Map();
  private searchCache: Map<string, CacheEntry<any>> = new Map();
  private couponCache: Map<string, CacheEntry<any>> = new Map();
  private categoryCache: Map<string, CacheEntry<any>> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private isSeeded = false;
  private activeSearchId = 0;

  public static getInstance(): FoodService {
    if (!FoodService.instance) {
      FoodService.instance = new FoodService();
    }
    return FoodService.instance;
  }

  private async getCachedValue<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = cache.get(key);
    const now = Date.now();
    
    if (cached) {
      if (now - cached.ts < this.CACHE_TTL) {
        return cached.data;
      }
      
      if (!cached.refreshing) {
        cached.refreshing = true;
        fetchFn()
          .then((freshData) => {
            cache.set(key, { data: freshData, ts: Date.now(), refreshing: false });
          })
          .catch((err) => {
            console.warn(`Background cache refresh failed for ${key}:`, err);
            cached.refreshing = false;
          });
      }
      return cached.data;
    }
    
    const freshData = await fetchFn();
    cache.set(key, { data: freshData, ts: Date.now(), refreshing: false });
    return freshData;
  }

  private async ensureSeeded() {
    if (this.isSeeded || !db) return;
    try {
      const q = query(collection(db, 'restaurants'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        console.log('FoodService: Seeding initial restaurants database...');
        
        const restaurants = [
          {
            id: 'r1',
            name: 'Meghana Foods',
            cuisine: 'Specialty Andhra Biryanis & Spices',
            cuisines: ['South Indian', 'Biryani'],
            rating: 4.5,
            deliveryTime: 35,
            bannerImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
            tagline: 'Famous spicy Andhra style biryanis with a signature 65 flavor profile.',
            platforms: ['Swiggy', 'Zomato'],
            isPureVeg: false,
            hasNonVeg: true
          },
          {
            id: 'r2',
            name: 'Truffles',
            cuisine: 'Gourmet Burgers, Pastas & Shakes',
            cuisines: ['Pizza', 'Fast Food', 'Desserts'],
            rating: 4.6,
            deliveryTime: 40,
            bannerImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
            tagline: 'Iconic big-bite burgers and thick cold milkshakes.',
            platforms: ['Swiggy', 'Zomato'],
            isPureVeg: false,
            hasNonVeg: true
          },
          {
            id: 'r3',
            name: 'Moti Mahal Delux',
            cuisine: 'Legendary Butter Chicken & Mughlai Classics',
            cuisines: ['North Indian'],
            rating: 4.4,
            deliveryTime: 32,
            bannerImage: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80',
            tagline: 'The pioneers of rich tandoori chicken and creamy sweet butter sauces.',
            platforms: ['Zomato', 'Swiggy'],
            isPureVeg: false,
            hasNonVeg: true
          },
          {
            id: 'r4',
            name: 'La Pinoz Pizza',
            cuisine: 'Visual Giant Pizzas & Cheeseburst Garlic Breads',
            cuisines: ['Pizza', 'Fast Food'],
            rating: 4.3,
            deliveryTime: 25,
            bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
            tagline: 'Hot bubble-crusted Italian specialty pies prepared freshly with mozzarella.',
            platforms: ['Zomato', 'Swiggy'],
            isPureVeg: false,
            hasNonVeg: true
          },
          {
            id: 'r5',
            name: 'Zepto Cafe',
            cuisine: 'Dynamic Baked Pastries, Fresh Sandwiches & Filter Coffee',
            cuisines: ['Desserts', 'South Indian'],
            rating: 4.8,
            deliveryTime: 12,
            bannerImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
            tagline: '10-minute ultra-speed delivery of roasted filter coffees, sub sandwiches and fries.',
            platforms: ['Zepto Cafe'],
            isPureVeg: true,
            hasNonVeg: false
          }
        ];

        for (const r of restaurants) {
          await setDoc(doc(db, 'restaurants', r.id), r);
        }

        const menuItems = [
          {
            id: 'f_meg_b1',
            restaurantId: 'r1',
            categoryName: 'Signature Biryanis',
            name: 'Chicken Boneless Biryani',
            description: 'A rich, heavily spiced rice dish featuring soft chunks of marinated boneless chicken.',
            price: 290,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 290, deliveryFee: 40, discount: 50, rating: 4.5, deliveryTime: 35 },
              { platform: 'Zomato', price: 295, deliveryFee: 35, discount: 45, rating: 4.4, deliveryTime: 38 }
            ]
          },
          {
            id: 'f_meg_b2',
            restaurantId: 'r1',
            categoryName: 'Signature Biryanis',
            name: 'Special Paneer Biryani',
            description: 'Vegetarian delight made with aromatic basmati rice and fiery marinated cottage cheese.',
            price: 260,
            dietType: 'Veg',
            isVeg: true,
            tag: 'recommended',
            image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 260, deliveryFee: 40, discount: 40, rating: 4.3, deliveryTime: 35 },
              { platform: 'Zomato', price: 255, deliveryFee: 40, discount: 40, rating: 4.3, deliveryTime: 37 }
            ]
          },
          {
            id: 'f_tru_b1',
            restaurantId: 'r2',
            categoryName: 'Craft Burgers',
            name: 'All American Cheese Burger',
            description: 'Thick grilled chicken patty loaded with melted cheese, jalapenos and caramelized onions.',
            price: 220,
            dietType: 'Non-Veg',
            isVeg: false,
            tag: 'best',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60',
            platformDeals: [
              { platform: 'Swiggy', price: 220, deliveryFee: 30, discount: 0, rating: 4.6, deliveryTime: 40 },
              { platform: 'Zomato', price: 225, deliveryFee: 25, discount: 10, rating: 4.5, deliveryTime: 45 }
            ]
          },
          {
            id: 'f_mot_m1',
            restaurantId: 'r3',
            categoryName: 'Butter Roast Delights',
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
            id: 'f_lap_l1',
            restaurantId: 'r4',
            categoryName: 'Gourmet Pizzas',
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
            id: 'f_zep_z1',
            restaurantId: 'r5',
            categoryName: 'Cafe Bites',
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
          }
        ];

        for (const item of menuItems) {
          await setDoc(doc(db, 'restaurant_menu', item.id), item);
        }

        const coupons = [
          { code: 'CHALO50', description: 'Get ₹50 discount on your first order', discount: 50, minOrder: 150 },
          { code: 'MEGHA60', description: 'Flat ₹60 discount on Meghana Foods', discount: 60, minOrder: 200, restaurantId: 'r1' },
          { code: 'ZEPTODELIGHT', description: 'Flat 20% off on Zepto Cafe orders', discount: 20, minOrder: 100, restaurantId: 'r5' },
          { code: 'CHALOSAVE', description: 'Save ₹30 on orders above ₹100', discount: 30, minOrder: 100 }
        ];

        for (const coupon of coupons) {
          await setDoc(doc(db, 'food_coupons', coupon.code), coupon);
        }
      }
      this.isSeeded = true;
    } catch (err) {
      console.warn('FoodService seeding checking failed:', err);
    }
  }

  async getRestaurants(filters: any, lastDoc: any = null, pageSize: number = 10) {
    const cacheKey = `restaurants_${JSON.stringify(filters)}_${lastDoc ? lastDoc.id : 'initial'}`;
    
    // PART 12 & PART 1 — OFFLINE-FIRST RESILIENCE
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) {
        console.log('[Offline] Serving restaurants list from offline cache');
        return cachedData;
      }
    }

    if (!db) return { restaurants: [], lastDoc: null };
    await this.ensureSeeded();

    const inMemKey = JSON.stringify(filters) + (lastDoc ? lastDoc.id : 'initial');
    
    const result = await this.getCachedValue(this.restaurantCache, inMemKey, async () => {
      try {
        let q = query(collection(db, 'restaurants'));
        
        if (filters?.diet === 'Veg') {
          q = query(q, where('isPureVeg', '==', true));
        } else if (filters?.diet === 'Non-Veg') {
          q = query(q, where('hasNonVeg', '==', true));
        }
        
        if (filters?.cuisine && filters?.cuisine !== 'All') {
          q = query(q, where('cuisines', 'array-contains', filters.cuisine));
        }

        const orderField = filters?.sort === 'rated' ? 'rating' : filters?.sort === 'fastest' ? 'deliveryTime' : 'rating';
        const orderDirection = filters?.sort === 'fastest' ? 'asc' : 'desc';
        q = query(q, orderBy(orderField, orderDirection));

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        q = query(q, limit(pageSize));

        const snapshot = await getDocs(q);
        const restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return {
          restaurants,
          lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'restaurants');
      }
    });

    // Save back to offline persistent cache
    if (result) {
      
      OfflineCacheInstance.saveToCache(cacheKey, result);
      
      // PART 16 — ANALYTICS
      AnalyticsInstance.track('Restaurant_List_Opened', { filters, count: result.restaurants.length });
    }

    return result;
  }

  async search(queryText: string) {
    const term = queryText.trim().toLowerCase();
    const cacheKey = `search_${term}`;

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) {
        console.log('[Offline] Serving searches from offline cache');
        return cachedData;
      }
    }

    if (!db || !term) return [];
    await this.ensureSeeded();
    const currentSearchId = ++this.activeSearchId;

    const result = await this.getCachedValue(this.searchCache, term, async () => {
      try {
        // PART 5 — ADVANCED SEARCH ENGINE
        // Prefix search, ranking, and scoring algorithms
        const q = query(collection(db, 'restaurants'));
        const snapshot = await getDocs(q);
        
        if (currentSearchId !== this.activeSearchId) {
          throw new Error('Search request cancelled');
        }

        const allRestaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const scored = allRestaurants.map((r: any) => {
          let score = 0;
          
          // Exact prefix matches
          if (r.name.toLowerCase().startsWith(term)) score += 100;
          if (r.cuisine.toLowerCase().startsWith(term)) score += 50;
          
          // Substring matches
          if (r.name.toLowerCase().includes(term)) score += 40;
          if (r.cuisine.toLowerCase().includes(term)) score += 20;
          if (r.cuisines?.some((c: string) => c.toLowerCase().includes(term))) score += 15;
          if (r.tagline?.toLowerCase().includes(term)) score += 5;

          // Rating weight
          score += (r.rating || 0) * 2;

          return { ...r, searchScore: score };
        });

        // Filter out zero matches and sort by high score
        return scored
          .filter(r => r.searchScore > 0)
          .sort((a, b) => b.searchScore - a.searchScore);
      } catch (err) {
        if (err instanceof Error && err.message === 'Search request cancelled') {
          return [];
        }
        handleFirestoreError(err, OperationType.LIST, 'restaurants/search');
      }
    });

    if (result) {
      
      OfflineCacheInstance.saveToCache(cacheKey, result);
      
      // PART 16 — ANALYTICS
      AnalyticsInstance.track('Search_Performed', { query: term, resultsCount: result.length });
    }

    return result;
  }

  async getRestaurantMenu(restaurantId: string) {
    const cacheKey = `menu_${restaurantId}`;

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) {
        console.log('[Offline] Serving restaurant menu from offline cache');
        return cachedData;
      }
    }

    if (!db) return [];
    await this.ensureSeeded();

    const result = await this.getCachedValue(this.menuCache, restaurantId, async () => {
      try {
        const q = query(collection(db, 'restaurant_menu'), where('restaurantId', '==', restaurantId));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categoriesMap: { [name: string]: any[] } = {};
        for (const item of items as any[]) {
          const catName = item.categoryName || 'General';
          if (!categoriesMap[catName]) {
            categoriesMap[catName] = [];
          }
          categoriesMap[catName].push(item);
        }

        return Object.keys(categoriesMap).map(name => ({
          name,
          items: categoriesMap[name]
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'restaurant_menu');
      }
    });

    if (result) {
      
      OfflineCacheInstance.saveToCache(cacheKey, result);
      
      // PART 16 — ANALYTICS
      AnalyticsInstance.track('Restaurant_Menu_Opened', { restaurantId });
    }

    return result;
  }

  async getCoupons() {
    const cacheKey = 'all_coupons';

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    if (!db) return [];
    await this.ensureSeeded();

    const result = await this.getCachedValue(this.couponCache, 'all_coupons', async () => {
      try {
        const snapshot = await getDocs(collection(db, 'food_coupons'));
        return snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => !(c as any)._isPlaceholder);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'food_coupons');
      }
    });

    if (result) {
      
      OfflineCacheInstance.saveToCache(cacheKey, result);
    }

    return result;
  }

  async saveSearchHistory(userId: string, searchTerm: string) {
    // PART 1 & 16 — OFFLINE-FIRST ARCHITECTURE & ANALYTICS
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    
    
    AnalyticsInstance.track('Recent_Search_Saved', { userId, searchTerm });

    if (isOffline) {
      OfflineCacheInstance.queueOfflineWrite('recent_search', {
        userId,
        searches: [{ term: searchTerm, timestamp: Date.now() }]
      });
      return;
    }

    if (!db) return;
    try {
      const docRef = doc(db, 'food_recent_searches', userId);
      await setDoc(docRef, {
        searches: arrayUnion({ term: searchTerm, timestamp: Date.now() })
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `food_recent_searches/${userId}`);
    }
  }

  async getSearchHistory(userId: string) {
    const cacheKey = `recent_searches_${userId}`;

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) return cachedData;
    }

    if (!db) return [];
    try {
      const docRef = doc(db, 'food_recent_searches', userId);
      const snap = await getDoc(docRef);
      const searches = snap.exists() ? (snap.data().searches || []) : [];
      
      if (searches.length > 0) {
        
        OfflineCacheInstance.saveToCache(cacheKey, searches);
      }
      return searches;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `food_recent_searches/${userId}`);
    }
  }

  async toggleFavorite(userId: string, restaurantId: string, isFavorite: boolean) {
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    
    
    AnalyticsInstance.track('Favorite_Toggled', { userId, restaurantId, isFavorite });

    if (isOffline) {
      OfflineCacheInstance.queueOfflineWrite(isFavorite ? 'add_favorite' : 'remove_favorite', {
        userId,
        restaurantId
      });
      return;
    }

    if (!db) return;
    try {
      const docRef = doc(db, 'food_favorites', `${userId}_${restaurantId}`);
      if (isFavorite) {
        await setDoc(docRef, {
          userId,
          restaurantId,
          timestamp: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, {
          deleted: true
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `food_favorites/${userId}_${restaurantId}`);
    }
  }

  async getFavorites(userId: string) {
    const cacheKey = `favorites_${userId}`;

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      
      const cachedData = OfflineCacheInstance.getFromCache(cacheKey);
      if (cachedData) return cachedData;
    }

    if (!db) return [];
    try {
      const q = query(collection(db, 'food_favorites'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const favList = snapshot.docs
        .map(doc => doc.data())
        .filter(d => !d.deleted)
        .map(d => d.restaurantId);

      
      OfflineCacheInstance.saveToCache(cacheKey, favList);
      
      return favList;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'food_favorites');
    }
  }

  // ============================================================================
  // PART 6 — ORDER STATE MACHINE
  // ============================================================================
  async createOrder(order: any): Promise<string> {
    if (!db) throw new Error('Firestore is not available');
    try {
      const docRef = doc(collection(db, 'food_orders'));
      const newOrder = {
        ...order,
        id: docRef.id,
        status: 'ORDER_PLACED',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timeline: [
          { status: 'ORDER_PLACED', timestamp: Date.now(), note: 'Order placed successfully.' }
        ],
        activityLog: [
          { timestamp: Date.now(), message: 'Order was submitted by client.', actor: 'user' }
        ]
      };
      await setDoc(docRef, newOrder);
      
      
      AnalyticsInstance.track('Order_Placed', { orderId: docRef.id, grandTotal: order.grandTotal });
      
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'food_orders');
    }
  }

  async updateOrderStatus(orderId: string, nextStatus: string, note: string): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'food_orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error(`Order ${orderId} not found`);

      const currentOrder = snap.data();
      const timeline = currentOrder.timeline || [];
      const activityLog = currentOrder.activityLog || [];

      timeline.push({
        status: nextStatus,
        timestamp: Date.now(),
        note: note
      });

      activityLog.push({
        timestamp: Date.now(),
        message: `Order status changed to ${nextStatus}. Note: ${note}`,
        actor: 'system'
      });

      await updateDoc(docRef, {
        status: nextStatus,
        timeline,
        activityLog,
        updatedAt: Date.now()
      });

      
      AnalyticsInstance.track('Order_Status_Updated', { orderId, status: nextStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `food_orders/${orderId}`);
    }
  }
}

export const FoodServiceInstance = FoodService.getInstance();
