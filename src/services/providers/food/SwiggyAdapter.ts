import { BaseFoodProvider } from './BaseFoodProvider';
import { ProviderId, UnifiedRestaurant, UnifiedMenuCategory } from '../../../models/UnifiedModels';

export class SwiggyAdapter extends BaseFoodProvider {
  providerId: ProviderId = 'swiggy';
  name = 'Swiggy';
  logo = 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png';

  async searchRestaurants(query: string, lat: number, lng: number): Promise<UnifiedRestaurant[]> {
    // Mock implementation
    if (!query) return [];
    
    return [
      {
        id: 'swiggy_rest_1',
        provider: 'swiggy' as ProviderId,
        providerRestaurantId: 'rest_1',
        name: 'Meghana Foods (Powered by Swiggy)',
        rating: 4.5,
        deliveryTime: 35,
        distance: 2.5,
        priceLevel: 2 as 1|2|3|4|5,
        veg: false,
        nonVeg: true,
        cuisine: ['Biryani', 'Andhra'],
        offers: ['20% OFF up to ₹50'],
        images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'],
        address: 'Koramangala, Bangalore',
        location: { lat, lng },
        openingHours: '11:00 AM',
        closingHours: '11:00 PM',
        deliveryFee: 40,
        minimumOrder: 150,
        availability: true
      }
    ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.cuisine.some(c => c.toLowerCase().includes(query.toLowerCase())));
  }

  async getRestaurant(restaurantId: string): Promise<UnifiedRestaurant | null> {
    return null;
  }

  async getMenu(restaurantId: string): Promise<UnifiedMenuCategory[]> {
    return [
      {
        id: 'cat_1',
        name: 'Recommended',
        items: [
          {
            itemId: 'item_1',
            provider: 'swiggy' as ProviderId,
            restaurantId: restaurantId,
            name: 'Chicken Boneless Biryani',
            description: 'Special boneless chicken biryani',
            category: 'Recommended',
            price: 290,
            originalPrice: 350,
            discount: 60,
            veg: false,
            nonVeg: true,
            egg: true,
            spiceLevel: 2,
            variants: [],
            addons: [],
            images: [],
            available: true,
            tax: 15
          }
        ]
      }
    ];
  }
}
