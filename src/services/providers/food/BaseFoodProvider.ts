import { IProviderAdapter } from '../IProviderAdapter';
import { ProviderId, ServiceType, UnifiedRestaurant, UnifiedMenuCategory, ProviderCart, ProviderOrder } from '../../../models/UnifiedModels';

export abstract class BaseFoodProvider implements IProviderAdapter {
  abstract providerId: ProviderId;
  serviceType: ServiceType = 'food';
  abstract name: string;
  abstract logo: string;

  async search(query: string, lat: number, lng: number): Promise<any[]> {
    return this.searchRestaurants(query, lat, lng);
  }

  abstract searchRestaurants(query: string, lat: number, lng: number): Promise<UnifiedRestaurant[]>;
  abstract getRestaurant(restaurantId: string): Promise<UnifiedRestaurant | null>;
  abstract getMenu(restaurantId: string): Promise<UnifiedMenuCategory[]>;

  async calculateCharges(cart: ProviderCart): Promise<ProviderCart> {
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.totalItemPrice;
    });

    const packingFee = 15;
    const platformFee = 5;
    const deliveryFee = 40;
    const taxes = subtotal * 0.05;
    const discountAmount = 0;

    return {
      ...cart,
      subtotal,
      packingFee,
      platformFee,
      deliveryFee,
      taxes,
      discountAmount,
      total: subtotal + packingFee + platformFee + deliveryFee + taxes - discountAmount,
      estimatedDeliveryTime: 30
    };
  }

  async placeOrder(cart: ProviderCart, address: string, coordinates: { lat: number; lng: number; }, paymentDetails: any): Promise<ProviderOrder> {
    return {
      providerOrderId: `ord_${this.providerId}_${Date.now()}`,
      provider: this.providerId,
      items: cart.items,
      status: 'pending',
      subtotal: cart.subtotal,
      fees: cart.packingFee + cart.platformFee + cart.deliveryFee,
      taxes: cart.taxes,
      discount: cart.discountAmount,
      total: cart.total,
      estimatedDelivery: Date.now() + 30 * 60000,
      createdAt: Date.now()
    };
  }

  async trackOrder(orderId: string): Promise<any> {
    return { status: 'preparing' };
  }

  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    return true;
  }

  async getOrderHistory(userId: string): Promise<ProviderOrder[]> {
    return [];
  }

  async getOffers(lat: number, lng: number): Promise<any[]> {
    return [];
  }

  async getCoupons(): Promise<any[]> {
    return [];
  }
}
