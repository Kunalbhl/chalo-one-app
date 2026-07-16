import { BaseStayProvider } from './BaseStayProvider';
import { ProviderId, UnifiedStay } from '../../../models/UnifiedModels';

export class BookingComAdapter extends BaseStayProvider {
  providerId: ProviderId = 'bookingcom';
  name = 'Booking.com';
  logo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Booking.com_logo.svg/1200px-Booking.com_logo.svg.png';

  async searchStays(query: string, location: string, checkIn: string, checkOut: string, guests: number): Promise<UnifiedStay[]> {
    if (!query && !location) return [];
    
    return [
      {
        id: 'booking_stay_1',
        provider: 'bookingcom' as ProviderId,
        providerStayId: 'stay_b1',
        name: 'Taj Palace Hotel',
        type: 'Hotel',
        location: { lat: 28.6139, lng: 77.2090, address: 'Sardar Patel Marg, New Delhi', city: 'Delhi' },
        rating: 4.8,
        reviewCount: 2450,
        images: ['https://images.unsplash.com/photo-1542314831-c6a4d14d8628?w=800&q=80'],
        amenities: ['Pool', 'Spa', 'Free WiFi', 'Breakfast Included'],
        roomPrice: 12500,
        taxes: 1500,
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        includesBreakfast: true,
        offers: ['10% Genius Discount']
      }
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.location.city.toLowerCase().includes(query.toLowerCase()));
  }
}
