import { 
  ProviderId, 
  ServiceType,
  UnifiedRestaurant, 
  UnifiedMenuCategory,
  UnifiedProduct,
  UnifiedStay,
  ProviderCart,
  ProviderOrder
} from '../../models/UnifiedModels';

export interface IProviderAdapter {
  providerId: ProviderId;
  serviceType: ServiceType;
  name: string;
  logo: string;
  
  // Auth / Linked Accounts
  getAuthUrl?(): string;
  linkAccount?(authCode: string): Promise<boolean>;
  refreshToken?(): Promise<boolean>;

  // Search & Discovery
  search(query: string, lat: number, lng: number): Promise<any[]>;
  
  // Food Specific
  searchRestaurants?(query: string, lat: number, lng: number): Promise<UnifiedRestaurant[]>;
  getRestaurant?(restaurantId: string): Promise<UnifiedRestaurant | null>;
  getMenu?(restaurantId: string): Promise<UnifiedMenuCategory[]>;

  // Mart Specific
  searchProducts?(query: string, lat: number, lng: number): Promise<UnifiedProduct[]>;
  
  // Stays Specific
  searchStays?(query: string, location: string, checkIn: string, checkOut: string, guests: number): Promise<UnifiedStay[]>;

  // Cart & Checkout
  calculateCharges(cart: ProviderCart): Promise<ProviderCart>;
  placeOrder(cart: ProviderCart, address: string, coordinates: {lat: number, lng: number}, paymentDetails: any): Promise<ProviderOrder>;
  
  // Order Management
  trackOrder(orderId: string): Promise<any>;
  cancelOrder(orderId: string, reason?: string): Promise<boolean>;
  getOrderHistory(userId: string): Promise<ProviderOrder[]>;
  
  // Promos
  getOffers(lat: number, lng: number): Promise<any[]>;
  getCoupons(): Promise<any[]>;
}
