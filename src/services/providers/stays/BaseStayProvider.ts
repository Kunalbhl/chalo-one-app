import { IProviderAdapter } from '../IProviderAdapter';
import { ProviderId, ServiceType, UnifiedStay, ProviderCart, ProviderOrder } from '../../../models/UnifiedModels';

export abstract class BaseStayProvider implements IProviderAdapter {
  abstract providerId: ProviderId;
  serviceType: ServiceType = 'stays';
  abstract name: string;
  abstract logo: string;

  async search(query: string, lat: number, lng: number): Promise<any[]> {
    return this.searchStays(query, "Any", "today", "tomorrow", 2);
  }

  abstract searchStays(query: string, location: string, checkIn: string, checkOut: string, guests: number): Promise<UnifiedStay[]>;

  async calculateCharges(cart: ProviderCart): Promise<ProviderCart> {
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.totalItemPrice;
    });

    const packingFee = 0;
    const platformFee = 100;
    const deliveryFee = 0;
    const taxes = subtotal * 0.12; // 12% GST on stays
    const discountAmount = 0;

    return {
      ...cart,
      subtotal,
      packingFee,
      platformFee,
      deliveryFee,
      taxes,
      discountAmount,
      total: subtotal + platformFee + taxes - discountAmount,
      estimatedDeliveryTime: 0
    };
  }

  async placeOrder(cart: ProviderCart, address: string, coordinates: { lat: number; lng: number; }, paymentDetails: any): Promise<ProviderOrder> {
    return {
      providerOrderId: `stay_${this.providerId}_${Date.now()}`,
      provider: this.providerId,
      items: cart.items,
      status: 'accepted',
      subtotal: cart.subtotal,
      fees: cart.packingFee + cart.platformFee + cart.deliveryFee,
      taxes: cart.taxes,
      discount: cart.discountAmount,
      total: cart.total,
      createdAt: Date.now()
    };
  }

  async trackOrder(orderId: string): Promise<any> {
    return { status: 'accepted' };
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
