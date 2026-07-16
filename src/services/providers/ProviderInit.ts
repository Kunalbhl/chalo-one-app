import { ProviderRegistry } from './ProviderRegistry';

import { SwiggyAdapter } from './food/SwiggyAdapter';
import { ZomatoAdapter } from './food/ZomatoAdapter';
import { BlinkitAdapter } from './mart/BlinkitAdapter';
import { ZeptoAdapter } from './mart/ZeptoAdapter';
import { BookingComAdapter } from './stays/BookingComAdapter';

export function initializeProviders() {
  ProviderRegistry.register(new SwiggyAdapter());
  ProviderRegistry.register(new ZomatoAdapter());
  ProviderRegistry.register(new BlinkitAdapter());
  ProviderRegistry.register(new ZeptoAdapter());
  ProviderRegistry.register(new BookingComAdapter());
  
  console.log('Provider Adapters Initialized.');
}
