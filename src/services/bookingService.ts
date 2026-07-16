import { collection, doc, setDoc, serverTimestamp, writeBatch, runTransaction, getDoc, FieldValue, increment, arrayUnion, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { HotelOption } from '../types';
import { CommerceDataInstance } from './data/CommerceDataMapper';

export interface BookingClick {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  destination: string;
  country: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  affiliateUrl: string;
  trackingId: string;
  campaign: string;
  device: string;
  platform: string;
  browser: string;
  ipHash?: string;
  clickedAt?: any;
  updatedAt?: any;
}

export interface BookingRecord {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  city: string;
  country: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  affiliateTrackingId: string;
  bookingValue: number;
  currency: string;
  estimatedCommission: number;
  confirmedCommission: number;
  paymentStatus: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CommissionRecord {
  commissionId: string;
  bookingId: string;
  trackingId: string;
  commissionValue: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  receivedAt?: any;
  updatedAt?: any;
}

// In-memory cache for hotel details
const hotelCache = new Map<string, { data: HotelOption, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const BookingService = {
  /**
   * Search hotels
   */
  async searchHotels(destination: string, filterStars: string, filterPlatform: string, sortMode: string): Promise<HotelOption[]> {
    const statsRef = doc(db, 'admin', 'booking_statistics');
    // We do not wait for the stats write to avoid blocking UI
    setDoc(statsRef, {
      totalSearches: increment(1)
    }, { merge: true }).catch(err => console.warn('Failed to track search:', err));

     
    const allHotels = (await CommerceDataInstance.getStaysData(destination, '')) as any as HotelOption[];

    let results = allHotels.filter(hotel => {
      const matchesSearch = hotel.name?.toLowerCase().includes(destination.toLowerCase()) ||
        hotel.distance?.toLowerCase().includes(destination.toLowerCase());
      
      const matchesStars = filterStars === 'All' || hotel.stars === Number(filterStars);

      const matchesPlatform = filterPlatform === 'All' || (hotel.comparisons && hotel.comparisons.some(c => 
        c.platform.toLowerCase().includes(filterPlatform.toLowerCase())
      ));

      return matchesSearch && matchesStars && matchesPlatform;
    });

    results = results.sort((a, b) => {
      const getCheapestPrice = (h: HotelOption) => {
        if (!h.comparisons || h.comparisons.length === 0) return 999999;
        return Math.min(...h.comparisons.map(c => c.pricePerNight));
      };

      if (sortMode === 'cheapest') {
        return getCheapestPrice(a) - getCheapestPrice(b);
      } else if (sortMode === 'fastest') {
        return b.stars - a.stars;
      } else if (sortMode === 'rated') {
        return b.rating - a.rating;
      } else {
        return 0;
      }
    });

    const now = Date.now();
    results.forEach(hotel => {
      hotelCache.set(hotel.id, { data: hotel, timestamp: now });
    });

    return Promise.resolve(results);
  },

  /**
   * Get hotel details with caching
   */
  async getHotelDetails(hotelId: string): Promise<HotelOption | null> {
    const now = Date.now();
    const cached = hotelCache.get(hotelId);
    
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

     
    const docRef = doc(db, 'stay_hotels', hotelId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const hotel = { id: docSnap.id, ...docSnap.data() } as HotelOption;
      hotelCache.set(hotelId, { data: hotel, timestamp: now });
      return hotel;
    }
    
    return null;
  },

  /**
   * Generate an official Booking.com affiliate URL
   */
  generateAffiliateLink(hotelName: string, destination: string, trackingId: string, campaign: string = 'default'): string {
    const aid = '2039203'; // Partner Affiliate ID
    const query = encodeURIComponent(`${hotelName} ${destination}`.trim());
    return `https://www.booking.com/searchresults.html?ss=${query}&aid=${aid}&label=${trackingId}&campaign=${campaign}`;
  },

  /**
   * Track outbound affiliate clicks
   */
  async trackAffiliateClick(userId: string, clickData: Omit<BookingClick, 'clickedAt' | 'updatedAt' | 'id'>): Promise<void> {
    const clickId = `CLICK-${Date.now()}`;
    const clickRef = doc(db, 'users', userId, 'booking_clicks', clickId);
    
    // Quick check to prevent rapid double-clicks (client side duplicate tracking)
    // Could also check firestore for recent clicks to same hotel
    const recentClickQuery = query(collection(db, 'users', userId, 'booking_clicks'), where('hotelId', '==', clickData.hotelId), orderBy('clickedAt', 'desc'), limit(1));
    const recentClickSnap = await getDocs(recentClickQuery);
    if (!recentClickSnap.empty) {
      const lastClick = recentClickSnap.docs[0].data();
      if (lastClick.clickedAt) {
          const lastClickTime = lastClick.clickedAt.toDate ? lastClick.clickedAt.toDate().getTime() : new Date(lastClick.clickedAt).getTime();
          if (Date.now() - lastClickTime < 60000) { // 1 minute throttle
              console.log('Skipping duplicate tracking within 1 minute');
              return;
          }
      }
    }

    const batch = writeBatch(db);
    batch.set(clickRef, {
      id: clickId,
      ...clickData,
      clickedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    const statsRef = doc(db, 'admin', 'booking_statistics');
    batch.set(statsRef, {
      totalClicks: increment(1),
      uniqueUsers: arrayUnion(userId) // Using arrayUnion safely adds if not present
    }, { merge: true });

    // Activity Log
    const logRef = doc(db, 'activity_logs', `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
    batch.set(logRef, {
      type: 'Hotel Click',
      userId,
      details: `Clicked ${clickData.hotelName}`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
  },

  /**
   * Record a new booking
   */
  async recordBooking(userId: string, booking: Omit<BookingRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    const bookingRef = doc(db, 'users', userId, 'bookings', booking.bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (bookingSnap.exists()) {
        return; // Prevent duplicate
    }
    
    const batch = writeBatch(db);
    batch.set(bookingRef, {
      ...booking,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Record pending commission
    const commissionId = `COMM-${booking.bookingId}`;
    const commissionRef = doc(db, 'users', userId, 'commissions', commissionId);
    batch.set(commissionRef, {
        commissionId,
        bookingId: booking.bookingId,
        trackingId: booking.affiliateTrackingId,
        commissionValue: booking.estimatedCommission,
        currency: booking.currency,
        status: 'pending',
        updatedAt: serverTimestamp()
    }, { merge: true });

    const statsRef = doc(db, 'admin', 'booking_statistics');
    batch.set(statsRef, {
      bookings: increment(1),
      estimatedRevenue: increment(booking.estimatedCommission),
      pendingCommission: increment(booking.estimatedCommission)
    }, { merge: true });

    // Activity Log
    const logRef = doc(db, 'activity_logs', `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
    batch.set(logRef, {
      type: 'Booking Created',
      userId,
      details: `Booked ${booking.hotelName}`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
  },

  /**
   * Get booking history with pagination
   */
  async getBookingHistory(userId: string, lastDoc: any = null, pageSize: number = 10): Promise<{ bookings: BookingRecord[], lastDoc: any }> {
    const bookingsRef = collection(db, 'users', userId, 'bookings');
    let q = query(bookingsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    
    if (lastDoc) {
      q = query(bookingsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => doc.data() as BookingRecord);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { bookings, lastDoc: newLastDoc };
  },

  /**
   * Get commissions with pagination
   */
  
  async updateBookingStatus(userId: string, bookingId: string, status: 'confirmed' | 'cancelled', actualCommission?: number): Promise<void> {
    const commissionId = `COMM-${bookingId}`;
    const commissionRef = doc(db, 'users', userId, 'commissions', commissionId);
    const commissionSnap = await getDoc(commissionRef);
    if (!commissionSnap.exists()) return;
    const commData = commissionSnap.data();
    
    if (commData.status === 'paid' || commData.status === 'cancelled') return; // Cannot modify already paid or cancelled

    const batch = writeBatch(db);
    const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
    
    const updateData: any = { status, updatedAt: serverTimestamp() };
    const commUpdate: any = { status: status === 'confirmed' ? 'approved' : 'cancelled', updatedAt: serverTimestamp() };
    
    if (actualCommission !== undefined && status === 'confirmed') {
      updateData.confirmedCommission = actualCommission;
      commUpdate.commissionValue = actualCommission;
    }
    
    batch.set(bookingRef, updateData, { merge: true });
    batch.set(commissionRef, commUpdate, { merge: true });
    
    // Update global statistics
    const statsRef = doc(db, 'admin', 'booking_statistics');
    if (status === 'confirmed') {
        const finalCommission = actualCommission !== undefined ? actualCommission : commData.commissionValue;
        batch.set(statsRef, {
            approvedCommission: increment(finalCommission),
            pendingCommission: increment(-commData.commissionValue) // Subtract original estimated value
        }, { merge: true });
    } else if (status === 'cancelled') {
        batch.set(statsRef, {
            cancelledBookings: increment(1),
            pendingCommission: increment(-commData.commissionValue) // Remove pending since cancelled
        }, { merge: true });
    }
    
    await batch.commit();
  },

  async settleCommission(userId: string, bookingId: string): Promise<void> {
    // Paid out via Wallet
    const batch = writeBatch(db);
    const commissionId = `COMM-${bookingId}`;
    const commissionRef = doc(db, 'users', userId, 'commissions', commissionId);
    const commissionSnap = await getDoc(commissionRef);
    if (!commissionSnap.exists()) throw new Error('Commission not found');
    
    const commData = commissionSnap.data();
    if (commData.status !== 'approved') throw new Error('Commission is not approved');

    batch.set(commissionRef, { status: 'paid', updatedAt: serverTimestamp() }, { merge: true });

    const walletRef = doc(db, 'users', userId, 'wallet', 'main');
    batch.set(walletRef, {
      balance: increment(commData.commissionValue),
      updatedAt: serverTimestamp()
    }, { merge: true });

    const txRef = doc(db, 'users', userId, 'wallet_history', `WTX-${Date.now()}`);
    batch.set(txRef, {
      type: 'credit',
      amount: commData.commissionValue,
      description: 'Booking Commission Settlement',
      bookingId,
      timestamp: serverTimestamp()
    });

    const statsRef = doc(db, 'admin', 'booking_statistics');
    batch.set(statsRef, {
      paidCommission: increment(commData.commissionValue),
      approvedCommission: increment(-commData.commissionValue)
    }, { merge: true });

    await batch.commit();
  },

  async getCommissions(userId: string, lastDoc: any = null, pageSize: number = 10): Promise<{ commissions: CommissionRecord[], lastDoc: any }> {
    const commsRef = collection(db, 'users', userId, 'commissions');
    let q = query(commsRef, orderBy('updatedAt', 'desc'), limit(pageSize));
    
    if (lastDoc) {
      q = query(commsRef, orderBy('updatedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const commissions = snapshot.docs.map(doc => doc.data() as CommissionRecord);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { commissions, lastDoc: newLastDoc };
  }
};
