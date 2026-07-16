export type ProviderId = 'swiggy' | 'zomato' | 'eatsure' | 'dominos' | 'pizzahut' | 'mcdonalds' | 'burgerking' | 'blinkit' | 'zepto' | 'instamart' | 'bigbasket' | 'dmart' | 'bookingcom' | 'agoda' | 'hotelscom' | 'expedia' | 'goibibo' | 'makemytrip';

export type ServiceType = 'food' | 'mart' | 'stays';

export interface UnifiedRestaurant {
  id: string; // Internal global ID
  provider: ProviderId;
  providerRestaurantId: string;
  name: string;
  rating: number;
  deliveryTime: number; // in minutes
  distance: number; // in km
  priceLevel: 1 | 2 | 3 | 4 | 5;
  veg: boolean;
  nonVeg: boolean;
  cuisine: string[];
  offers: string[];
  images: string[];
  logo?: string;
  address: string;
  location: { lat: number; lng: number };
  openingHours: string;
  closingHours: string;
  deliveryFee: number;
  minimumOrder: number;
  availability: boolean;
}

export interface UnifiedMenuCategory {
  id: string;
  name: string;
  items: UnifiedMenuItem[];
}

export interface UnifiedMenuItem {
  itemId: string;
  provider: ProviderId;
  restaurantId: string; // The unified restaurant ID
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  veg: boolean;
  nonVeg: boolean;
  egg: boolean;
  spiceLevel: 0 | 1 | 2 | 3; // 0=none, 3=very spicy
  variants: MenuVariant[];
  addons: MenuAddon[];
  images: string[];
  available: boolean;
  stock?: number;
  tax: number;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // Unique for cart line item
  menuItem: UnifiedMenuItem;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedAddons: MenuAddon[];
  totalItemPrice: number; // calculated
}

export interface ProviderCart {
  provider: ProviderId;
  items: CartItem[];
  subtotal: number;
  packingFee: number;
  platformFee: number;
  deliveryFee: number;
  taxes: number;
  couponsApplied: string[];
  discountAmount: number;
  total: number;
  estimatedDeliveryTime: number;
}

export interface UnifiedCart {
  masterCartId: string;
  userId: string;
  providerCarts: Record<ProviderId, ProviderCart>;
  totalSubtotal: number;
  totalFees: number;
  totalTaxes: number;
  totalDiscounts: number;
  grandTotal: number;
}

export interface LinkedAccount {
  userId: string;
  provider: ProviderId;
  status: 'connected' | 'not_connected' | 'expired';
  providerUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  lastLogin?: number;
  lastOrder?: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'packed' | 'picked_up' | 'nearby' | 'delivered' | 'cancelled' | 'refunded';

export interface ProviderOrder {
  providerOrderId: string;
  provider: ProviderId;
  externalOrderId?: string; // ID from provider system
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  fees: number;
  taxes: number;
  discount: number;
  total: number;
  trackingLink?: string;
  estimatedDelivery?: number;
  createdAt: number;
}

export interface MasterOrder {
  masterOrderId: string;
  userId: string;
  providerOrders: ProviderOrder[];
  status: OrderStatus;
  grandTotal: number;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number, lng: number };
  paymentTransactionId: string;
  createdAt: number;
  updatedAt: number;
}

export interface UnifiedProduct {
  id: string;
  provider: ProviderId;
  providerProductId: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  quantity: string; // e.g. "1 kg", "500g"
  images: string[];
  category: string;
  inStock: boolean;
  deliveryTime: number; // mins
}

export interface UnifiedStay {
  id: string;
  provider: ProviderId;
  providerStayId: string;
  name: string;
  type: string; // Hotel, Resort, Villa
  location: { lat: number; lng: number; address: string; city: string };
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  roomPrice: number;
  taxes: number;
  cancellationPolicy: string;
  includesBreakfast: boolean;
  offers: string[];
}
