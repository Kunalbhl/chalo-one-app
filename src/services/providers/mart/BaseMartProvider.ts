import { IProviderAdapter } from '../IProviderAdapter';
import { ProviderId, ServiceType, UnifiedProduct, ProviderCart, ProviderOrder } from '../../../models/UnifiedModels';

export abstract class BaseMartProvider implements IProviderAdapter {
  abstract providerId: ProviderId;
  serviceType: ServiceType = 'mart';
  abstract name: string;
  abstract logo: string;

  async search(query: string, lat: number, lng: number): Promise<any[]> {
    return this.searchProducts(query, lat, lng);
  }

  abstract searchProducts(query: string, lat: number, lng: number): Promise<UnifiedProduct[]>;

  async calculateCharges(cart: ProviderCart): Promise<ProviderCart> {
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.totalItemPrice;
    });

    const packingFee = 10;
    const platformFee = 5;
    const deliveryFee = 25;
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
      estimatedDeliveryTime: 10
    };
  }

  async placeOrder(cart: ProviderCart, address: string, coordinates: { lat: number; lng: number; }, paymentDetails: any): Promise<ProviderOrder> {
    return {
      providerOrderId: `mart_${this.providerId}_${Date.now()}`,
      provider: this.providerId,
      items: cart.items,
      status: 'pending',
      subtotal: cart.subtotal,
      fees: cart.packingFee + cart.platformFee + cart.deliveryFee,
      taxes: cart.taxes,
      discount: cart.discountAmount,
      total: cart.total,
      estimatedDelivery: Date.now() + 10 * 60000,
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
