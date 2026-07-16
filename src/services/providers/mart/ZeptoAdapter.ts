import { BaseMartProvider } from './BaseMartProvider';
import { ProviderId, UnifiedProduct } from '../../../models/UnifiedModels';

export class ZeptoAdapter extends BaseMartProvider {
  providerId: ProviderId = 'zepto';
  name = 'Zepto';
  logo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Zepto_Logo.jpg/1200px-Zepto_Logo.jpg';

  async searchProducts(query: string, lat: number, lng: number): Promise<UnifiedProduct[]> {
    if (!query) return [];
    
    return [
      {
        id: 'zepto_prod_1',
        provider: 'zepto' as ProviderId,
        providerProductId: 'prod_z1',
        name: 'Amul Taaza Milk',
        description: 'Toned Milk',
        price: 64,
        originalPrice: 66,
        discount: 2,
        quantity: '1 L',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80'],
        category: 'Dairy',
        inStock: true,
        deliveryTime: 11
      }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()));
  }
}
