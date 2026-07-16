import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ServiceType, UnifiedRestaurant, UnifiedMenuItem, UnifiedProduct, UnifiedStay } from '../../models/UnifiedModels';

export class ComparisonEngine {
  async compareRestaurants(query: string, lat: number, lng: number): Promise<UnifiedRestaurant[]> {
    const adapters = ProviderRegistry.getAdaptersByService('food');
    const promises = adapters.map(adapter => adapter.searchRestaurants ? adapter.searchRestaurants(query, lat, lng) : Promise.resolve([]));
    
    const resultsArray = await Promise.all(promises);
    const allRestaurants: UnifiedRestaurant[] = resultsArray.flat();

    // Remove direct duplicates (same providerRestaurantId for same provider, though ideally we could merge across providers if they are the exact same place)
    // For now, return all since they indicate different platform pricing/fees
    return allRestaurants.sort((a, b) => b.rating - a.rating); // Sort by highest rating default
  }

  async compareProducts(query: string, lat: number, lng: number): Promise<UnifiedProduct[]> {
    const adapters = ProviderRegistry.getAdaptersByService('mart');
    const promises = adapters.map(adapter => adapter.searchProducts ? adapter.searchProducts(query, lat, lng) : Promise.resolve([]));
    
    const resultsArray = await Promise.all(promises);
    const allProducts: UnifiedProduct[] = resultsArray.flat();

    return allProducts.sort((a, b) => a.price - b.price); // Lowest price default
  }

  async compareStays(query: string, location: string, checkIn: string, checkOut: string, guests: number): Promise<UnifiedStay[]> {
    const adapters = ProviderRegistry.getAdaptersByService('stays');
    const promises = adapters.map(adapter => adapter.searchStays ? adapter.searchStays(query, location, checkIn, checkOut, guests) : Promise.resolve([]));
    
    const resultsArray = await Promise.all(promises);
    const allStays: UnifiedStay[] = resultsArray.flat();

    return allStays.sort((a, b) => a.roomPrice - b.roomPrice); // Lowest price default
  }
}

export const ComparisonInstance = new ComparisonEngine();
