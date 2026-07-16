import { IProviderAdapter } from './IProviderAdapter';
import { ProviderId, ServiceType } from '../../models/UnifiedModels';

class ProviderRegistryService {
  private providers: Map<ProviderId, IProviderAdapter> = new Map();

  register(adapter: IProviderAdapter) {
    this.providers.set(adapter.providerId, adapter);
  }

  getAdapter(providerId: ProviderId): IProviderAdapter | undefined {
    return this.providers.get(providerId);
  }

  getAdaptersByService(serviceType: ServiceType): IProviderAdapter[] {
    return Array.from(this.providers.values()).filter(p => p.serviceType === serviceType);
  }
}

export const ProviderRegistry = new ProviderRegistryService();
