import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  runTransaction, serverTimestamp, query, where, limit
} from 'firebase/firestore';
import { OrderService } from './orderService';
import { NotificationService } from './notificationService';

// Driver Operational Statuses
export enum DriverStatus {
  Available = 'Available',
  Busy = 'Busy',
  Offline = 'Offline',
  Break = 'Break',
  Assigned = 'Assigned',
  Returning = 'Returning'
}

export const DriverService = {
  /**
   * Update live driver location, bearing, and speed telemetry
   */
  async updateDriverLocation(
    driverId: string, 
    latitude: number, 
    longitude: number, 
    bearing: number = 0, 
    speed: number = 0
  ): Promise<void> {
    const locRef = doc(db, 'driver_locations', driverId);
    
    await setDoc(locRef, {
      driverId,
      latitude,
      longitude,
      bearing,
      speed,
      timestamp: serverTimestamp()
    }, { merge: true });
  },

  /**
   * Update active driver work status
   */
  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
    const locRef = doc(db, 'driver_locations', driverId);
    await setDoc(locRef, {
      status,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  /**
   * Fetch all active available drivers in the system
   */
  async getAvailableDrivers(): Promise<any[]> {
    const q = query(
      collection(db, 'driver_locations'),
      where('status', '==', DriverStatus.Available)
    );
    const snap = await getDocs(q);
    const drivers: any[] = [];
    snap.forEach(d => {
      drivers.push({ driverId: d.id, ...d.data() });
    });
    return drivers;
  },

  /**
   * Core Auto-Dispatch Scoring Engine (Part 3 & 4)
   * Matches the best Available driver for an order using weighted heuristics:
   * - Proximity (40 pts)
   * - Workload (20 pts)
   * - Driver Rating (20 pts)
   * - Acceptance Rate (20 pts)
   */
  async findBestDriverForOrder(orderId: string, branchLatitude: number, branchLongitude: number): Promise<string | null> {
    const availableDrivers = await this.getAvailableDrivers();
    if (availableDrivers.length === 0) return null;

    let bestDriverId: string | null = null;
    let highestScore = -1;

    for (const driver of availableDrivers) {
      let score = 0;

      // 1. Proximity Scoring (40 Points Max)
      // Closer drivers get higher scores
      const driverLat = driver.latitude || 12.9716;
      const driverLng = driver.longitude || 77.5946;
      const R = 6371; // Earth's radius
      const dLat = (branchLatitude - driverLat) * Math.PI / 180;
      const dLon = (branchLongitude - driverLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(driverLat * Math.PI / 180) * Math.cos(branchLatitude * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      const distanceScore = Math.max(0, 40 - (distance * 8)); // Subtract 8 points per km
      score += distanceScore;

      // 2. Workload / Queue Load Scoring (20 Points Max)
      const workload = driver.activeOrdersCount || 0;
      const workloadScore = Math.max(0, 20 - (workload * 10)); // Subtract 10 points per active order
      score += workloadScore;

      // 3. Driver Quality Rating (20 Points Max)
      const rating = driver.rating || 4.8; // Default to 4.8
      const ratingScore = (rating / 5) * 20;
      score += ratingScore;

      // 4. Historical Acceptance Rate (20 Points Max)
      const acceptanceRate = driver.acceptanceRate || 0.95; // Default 95%
      const acceptanceScore = acceptanceRate * 20;
      score += acceptanceScore;

      if (score > highestScore) {
        highestScore = score;
        bestDriverId = driver.driverId;
      }
    }

    return bestDriverId;
  },

  /**
   * Atomic Dispatch Assignment process
   */
  async assignDriverToOrder(orderId: string, driverId: string, mode: 'Auto' | 'Manual' = 'Auto'): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    const driverRef = doc(db, 'driver_locations', driverId);
    const assignmentId = `ASG-${Date.now()}`;
    const assignmentRef = doc(db, 'driver_assignments', assignmentId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error(`Order ${orderId} does not exist.`);
      }

      // Assign Driver inside transaction
      transaction.update(orderRef, {
        driverId,
        status: 'Driver Assigned',
        updatedAt: serverTimestamp()
      });

      // Update driver availability
      transaction.update(driverRef, {
        status: DriverStatus.Assigned,
        activeOrderId: orderId,
        updatedAt: serverTimestamp()
      });

      // Log Dispatch Assignment tracking record
      transaction.set(assignmentRef, {
        assignmentId,
        orderId,
        driverId,
        mode,
        status: 'Assigned',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Log history record
      const historyId = `HIST-${Date.now()}`;
      const historyRef = doc(db, 'driver_history', historyId);
      transaction.set(historyRef, {
        id: historyId,
        driverId,
        orderId,
        type: 'Assigned',
        timestamp: serverTimestamp()
      }, { merge: true });
    });

    // Write timeline event log
    await OrderService.logOrderEvent(
      orderId, 
      'Driver Assigned', 
      'Dispatcher', 
      `Driver ${driverId} assigned via ${mode} dispatch.`, 
      null, 
      'Dispatch process finished.'
    );

    // Send instant push notification to driver & customer
    await NotificationService.addNotification(
      driverId,
      '🛵 New Delivery Assigned!',
      `You have been assigned order #${orderId.slice(-5).toUpperCase()}. Tap to view details.`,
      'system',
      { icon: '📦' }
    );
  }
};
