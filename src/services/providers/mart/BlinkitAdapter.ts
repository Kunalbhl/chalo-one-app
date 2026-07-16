import { BaseMartProvider } from './BaseMartProvider';
import { ProviderId, UnifiedProduct } from '../../../models/UnifiedModels';

export class BlinkitAdapter extends BaseMartProvider {
  providerId: ProviderId = 'blinkit';
  name = 'Blinkit';
  logo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Blinkit-yellow-app-icon.svg/1200px-Blinkit-yellow-app-icon.svg.png';

  async searchProducts(query: string, lat: number, lng: number): Promise<UnifiedProduct[]> {
    if (!query) return [];
    
    return [
      {
        id: 'blinkit_prod_1',
        provider: 'blinkit' as ProviderId,
        providerProductId: 'prod_b1',
        name: 'Amul Taaza Milk',
        description: 'Toned Milk',
        price: 66,
        originalPrice: 66,
        discount: 0,
        quantity: '1 L',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80'],
        category: 'Dairy',
        inStock: true,
        deliveryTime: 9
      }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()));
  }
}
