import { BaseFoodProvider } from './BaseFoodProvider';
import { ProviderId, UnifiedRestaurant, UnifiedMenuCategory } from '../../../models/UnifiedModels';

export class ZomatoAdapter extends BaseFoodProvider {
  providerId: ProviderId = 'zomato';
  name = 'Zomato';
  logo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Zomato_logo.png/600px-Zomato_logo.png';

  async searchRestaurants(query: string, lat: number, lng: number): Promise<UnifiedRestaurant[]> {
    if (!query) return [];
    
    return [
      {
        id: 'zomato_rest_1',
        provider: 'zomato' as ProviderId,
        providerRestaurantId: 'rest_z1',
        name: 'Biryani By Kilo (Powered by Zomato)',
        rating: 4.4,
        deliveryTime: 45,
        distance: 3.2,
        priceLevel: 3 as 1|2|3|4|5,
        veg: false,
        nonVeg: true,
        cuisine: ['Biryani', 'Mughlai'],
        offers: ['Use CHALOSAVE for ₹50 OFF'],
        images: ['https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80'],
        address: 'Indiranagar, Bangalore',
        location: { lat, lng },
        openingHours: '10:00 AM',
        closingHours: '12:00 AM',
        deliveryFee: 55,
        minimumOrder: 200,
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
        id: 'cat_z1',
        name: 'Bestsellers',
        items: [
          {
            itemId: 'item_z1',
            provider: 'zomato' as ProviderId,
            restaurantId: restaurantId,
            name: 'Chicken Dum Biryani',
            description: 'Authentic dum biryani',
            category: 'Bestsellers',
            price: 320,
            veg: false,
            nonVeg: true,
            egg: false,
            spiceLevel: 2,
            variants: [],
            addons: [],
            images: [],
            available: true,
            tax: 16
          }
        ]
      }
    ];
  }
}
