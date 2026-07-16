export interface MenuVariant {
  id: string;
  name: string; // e.g., "Small", "Medium", "Large"
  additionalPrice: number;
  inStock: boolean;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  isRequired?: boolean;
  nestedAddons?: MenuAddon[]; // Nested addons!
}

export interface MenuAddonGroup {
  id: string;
  name: string; // e.g., "Toppings", "Crusts"
  minSelect: number; // 0 for optional, >=1 for required
  maxSelect: number; // 1 for single choice, >1 for multi choice
  addons: MenuAddon[];
}

export interface AdvancedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // base price
  dietType: 'Veg' | 'Non-Veg' | 'Eggetarian';
  isVeg: boolean;
  image: string;
  tag?: 'best' | 'repeated' | 'recommended';
  variants?: MenuVariant[];
  addonGroups?: MenuAddonGroup[];
  inStock: boolean;
  inventoryCount?: number;
  restaurantId: string;
  platformDeals: {
    platform: string;
    price: number;
    deliveryFee: number;
    discount: number;
    rating: number;
    deliveryTime: number;
    inStock?: boolean;
  }[];
}

export interface FoodCartItem {
  id: string; // Unique instance id, e.g. "dishId_variantId_addonIds"
  dishId: string;
  name: string; // Full customized name
  restaurantId: string;
  restaurantName: string;
  platform: 'Swiggy' | 'Zomato' | 'EatSure' | 'Zepto Cafe';
  basePrice: number;
  selectedVariant?: MenuVariant;
  selectedAddons: MenuAddon[];
  quantity: number;
  unitPrice: number; // calculated base + variant + addons
  deliveryFee: number;
  discount: number;
  deliveryTime: number;
  rating: number;
  image: string;
  isVeg: boolean;
}

export interface EnterpriseCart {
  id: string;
  userId: string;
  isGuest: boolean;
  items: FoodCartItem[];
  lastUpdated: number;
  isAbandoned?: boolean;
}

export interface Coupon {
  code: string;
  description: string;
  discount: number; // Amount or percentage
  minOrder: number;
  restaurantId?: string;
  platformId?: string;
  categoryLimit?: string;
  expiryTimestamp: number;
  usageLimit: number;
  userLimit: number;
  type: 'restaurant' | 'platform' | 'wallet' | 'referral';
}

export enum OrderStatus {
  ORDER_PLACED = 'ORDER_PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVING = 'ARRIVING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface OrderStateTimeline {
  status: OrderStatus;
  timestamp: number;
  note: string;
}

export interface OrderActivityLog {
  timestamp: number;
  message: string;
  actor: 'system' | 'restaurant' | 'driver' | 'user';
}

export interface FoodOrder {
  id: string;
  userId: string;
  items: FoodCartItem[];
  restaurantId: string;
  restaurantName: string;
  platform: string;
  status: OrderStatus;
  timeline: OrderStateTimeline[];
  activityLog: OrderActivityLog[];
  subtotal: number;
  deliveryFee: number;
  packingCharge: number;
  platformFee: number;
  gstAmount: number;
  surgeCharge: number;
  couponDiscount: number;
  walletDeduction: number;
  referralDiscount: number;
  grandTotal: number;
  createdAt: number;
  updatedAt: number;
}

export interface PricingBreakdown {
  subtotal: number;
  deliveryFee: number;
  packingCharge: number;
  platformFee: number;
  gstAmount: number;
  surgeCharge: number;
  couponDiscount: number;
  walletDeduction: number;
  referralDiscount: number;
  pointsEarned: number;
  grandTotal: number;
}
