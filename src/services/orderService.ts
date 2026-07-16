import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  runTransaction, serverTimestamp, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { NotificationService } from './notificationService';

// Standard Enum Declarations for Order Statuses
export enum OrderStatus {
  Draft = 'Draft',
  PendingPayment = 'Pending Payment',
  PaymentAuthorized = 'Payment Authorized',
  Confirmed = 'Confirmed',
  Accepted = 'Accepted',
  Preparing = 'Preparing',
  Packed = 'Packed',
  Ready = 'Ready',
  DriverAssigned = 'Driver Assigned',
  PickedUp = 'Picked Up',
  NearCustomer = 'Near Customer',
  Delivered = 'Delivered',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  RefundRequested = 'Refund Requested',
  RefundApproved = 'Refund Approved',
  Refunded = 'Refunded',
  Failed = 'Failed'
}

// Strict Transition Map
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'Draft': ['Pending Payment', 'Cancelled'],
  'Pending Payment': ['Payment Authorized', 'Failed', 'Cancelled'],
  'Payment Authorized': ['Confirmed', 'Failed'],
  'Confirmed': ['Accepted', 'Cancelled'],
  'Accepted': ['Preparing', 'Cancelled'],
  'Preparing': ['Packed', 'Cancelled'],
  'Packed': ['Ready', 'Cancelled'],
  'Ready': ['Driver Assigned', 'Cancelled'],
  'Driver Assigned': ['Picked Up', 'Cancelled'],
  'Picked Up': ['Near Customer', 'Cancelled'],
  'Near Customer': ['Delivered', 'Cancelled'],
  'Delivered': ['Completed', 'Refund Requested'],
  'Completed': ['Refund Requested'],
  'Refund Requested': ['Refund Approved', 'Completed', 'Cancelled'],
  'Refund Approved': ['Refunded'],
  'Refunded': [],
  'Cancelled': [],
  'Failed': []
};

// Haversine Distance Formula for real distance calculation
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const OrderService = {
  /**
   * Validate order status transition
   */
  validateTransition(current: string, next: string): boolean {
    if (!current) return true; // Initial state
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  },

  /**
   * Create a new Order in the centralized orders collection
   */
  async createOrder(orderData: any): Promise<string> {
    const orderId = orderData.id || `ORD-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const orderRef = doc(db, 'orders', orderId);

    const payload = {
      ...orderData,
      id: orderId,
      status: orderData.status || OrderStatus.Draft,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(orderRef, payload, { merge: true });

    // Create initial timeline event
    await this.logOrderEvent(orderId, payload.status, 'System', 'Order initialized', null, 'Created via OrderService');

    return orderId;
  },

  /**
   * Update Order Status using strict state machine validations inside a Firestore transaction
   */
  async updateOrderStatus(
    orderId: string, 
    newStatus: string, 
    changedBy: string, 
    reason: string = '', 
    location: any = null, 
    notes: string = ''
  ): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error(`Order ${orderId} does not exist.`);
      }

      const orderData = orderSnap.data();
      const currentStatus = orderData.status || OrderStatus.Draft;

      // Validate Transition
      if (!this.validateTransition(currentStatus, newStatus)) {
        throw new Error(`Illegal state transition from ${currentStatus} to ${newStatus}.`);
      }

      // Perform Status Update
      transaction.update(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Handle Partner Wallet Credits upon order 'Completed' state
      if (newStatus === OrderStatus.Completed && orderData.partnerId) {
        const partnerRef = doc(db, 'partners', orderData.partnerId);
        const partnerSnap = await transaction.get(partnerRef);

        if (partnerSnap.exists()) {
          const partnerData = partnerSnap.data();
          const ordTotal = orderData.totalAmount || orderData.totalPrice || 0;
          const commissionRate = partnerData.commissionRate || 10;
          const commissionAmount = ordTotal * (commissionRate / 100);
          const payoutAmount = ordTotal - commissionAmount;

          transaction.update(partnerRef, {
            walletBalance: (partnerData.walletBalance || 0) + payoutAmount,
            updatedAt: serverTimestamp()
          });

          // Log settlement payout
          const settlementId = `SETTLE-${Date.now()}`;
          const settlementRef = doc(db, `partners/${orderData.partnerId}/settlements`, settlementId);
          transaction.set(settlementRef, {
            id: settlementId,
            orderId,
            orderTotal: ordTotal,
            commissionPct: commissionRate,
            commissionDeducted: commissionAmount,
            tdsDeducted: payoutAmount * 0.01,
            gstDeducted: commissionAmount * 0.18,
            netPayout: payoutAmount - (payoutAmount * 0.01) - (commissionAmount * 0.18),
            status: 'Pending',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    });

    // Write immutable log outside transaction to prevent transaction blockages
    await this.logOrderEvent(orderId, newStatus, changedBy, reason, location, notes);

    // Trigger Notification automatically
    const finalSnap = await getDoc(orderRef);
    if (finalSnap.exists()) {
      const orderData = finalSnap.data();
      await this.triggerNotifications(orderData, newStatus, reason);
    }
  },

  /**
   * Log immutable event in the order_events collection
   */
  async logOrderEvent(
    orderId: string, 
    status: string, 
    changedBy: string, 
    reason: string = '', 
    location: any = null, 
    notes: string = ''
  ): Promise<string> {
    const eventId = `EVT-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const eventRef = doc(db, 'order_events', eventId);

    const eventPayload = {
      eventId,
      orderId,
      status,
      changedBy,
      reason,
      location,
      notes,
      timestamp: serverTimestamp()
    };

    await setDoc(eventRef, eventPayload, { merge: true });

    // Also push event to tracking subcollection or order array for easy querying
    const orderRef = doc(db, 'orders', orderId);
    const trackingRef = doc(db, `orders/${orderId}/timeline`, eventId);
    await setDoc(trackingRef, eventPayload, { merge: true });

    return eventId;
  },

  /**
   * Automatic ETA Calculation Engine
   */
  calculateETA(
    prepTime: number = 15,
    driverLat?: number,
    driverLng?: number,
    restLat?: number,
    restLng?: number,
    custLat?: number,
    custLng?: number,
    weather: string = 'Clear',
    traffic: string = 'Normal'
  ): number {
    let totalMinutes = prepTime;

    // Driver to Restaurant travel time
    if (driverLat && driverLng && restLat && restLng) {
      const distToRest = calculateHaversineDistance(driverLat, driverLng, restLat, restLng);
      totalMinutes += distToRest * 2; // Average 30 km/h is 2 mins per km
    }

    // Restaurant to Customer travel time
    if (restLat && restLng && custLat && custLng) {
      const distToCust = calculateHaversineDistance(restLat, restLng, custLat, custLng);
      totalMinutes += distToCust * 2.4; // Average 25 km/h is 2.4 mins per km
    }

    // Weather impact multiplier
    if (weather === 'Rainy') {
      totalMinutes *= 1.3;
    } else if (weather === 'Heavy Rain' || weather === 'Storm') {
      totalMinutes *= 1.6;
    }

    // Traffic impact multiplier
    if (traffic === 'High') {
      totalMinutes *= 1.4;
    } else if (traffic === 'Jam' || traffic === 'Rush Hour') {
      totalMinutes *= 1.7;
    }

    return Math.round(totalMinutes);
  },

  /**
   * Dispatch dispute refund requests
   */
  async requestRefund(orderId: string, reason: string, amount: number, customerId: string): Promise<string> {
    const refundId = `RF-${Date.now()}`;
    const refundRef = doc(db, 'refunds', refundId);

    await setDoc(refundRef, {
      id: refundId,
      orderId,
      customerId,
      amount,
      reason,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    await this.updateOrderStatus(orderId, OrderStatus.RefundRequested, 'Customer', reason, null, `Requested refund of ₹${amount}`);

    return refundId;
  },

  /**
   * Approve a refund request and perform financial adjustments
   */
  async approveRefund(refundId: string, approvedBy: string): Promise<void> {
    const refundRef = doc(db, 'refunds', refundId);
    const refundSnap = await getDoc(refundRef);

    if (!refundSnap.exists()) {
      throw new Error("Refund document does not exist.");
    }

    const refundData = refundSnap.data();
    const orderId = refundData.orderId;

    await runTransaction(db, async (transaction) => {
      transaction.update(refundRef, {
        status: 'Approved',
        approvedBy,
        updatedAt: serverTimestamp()
      });

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (orderSnap.exists()) {
        const orderData = orderSnap.data();

        // Update Order to Refunded Status
        transaction.update(orderRef, {
          status: OrderStatus.Refunded,
          updatedAt: serverTimestamp()
        });

        // Deduct from Partner wallet if they were already paid
        if (orderData.partnerId) {
          const partnerRef = doc(db, 'partners', orderData.partnerId);
          const partnerSnap = await transaction.get(partnerRef);
          if (partnerSnap.exists()) {
            const partnerData = partnerSnap.data();
            const payoutAmount = (orderData.totalAmount || orderData.totalPrice || 0) * 0.9; // Less 10% default commission

            transaction.update(partnerRef, {
              walletBalance: Math.max(0, (partnerData.walletBalance || 0) - payoutAmount),
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    });

    await this.logOrderEvent(orderId, OrderStatus.Refunded, approvedBy, 'Refund approved and funds reversed', null, 'Financial rollback successful');
  },

  /**
   * Handle Notification Dispatch across channels
   */
  async triggerNotifications(orderData: any, status: string, reason: string): Promise<void> {
    const orderIdShort = orderData.id.slice(-5).toUpperCase();

    // 1. Notify Customer
    if (orderData.userId) {
      await NotificationService.addNotification(
        orderData.userId,
        `🔔 Order Status Update: ${status}`,
        `Your order #${orderIdShort} has transitioned to ${status.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
        'food',
        { icon: '📦' }
      );
    }

    // 2. Notify Partner/Merchant
    if (orderData.partnerId) {
      await NotificationService.addNotification(
        orderData.partnerId,
        `📈 Order Update #${orderIdShort}`,
        `Order transitioned to ${status}. Update staff accordingly.`,
        'system',
        { icon: '🏪' }
      );
    }

    // 3. Notify Driver (if assigned)
    if (orderData.driverId) {
      await NotificationService.addNotification(
        orderData.driverId,
        `🚴 Delivery Update #${orderIdShort}`,
        `Assigned order is now ${status}. Proceed with delivery instructions.`,
        'system',
        { icon: '🛵' }
      );
    }
  },

  /**
   * Real-time listeners for live tracking views
   */
  subscribeToOrder(orderId: string, callback: (order: any) => void) {
    return onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      }
    });
  },

  /**
   * Real-time listener for order timeline events
   */
  subscribeToOrderTimeline(orderId: string, callback: (events: any[]) => void) {
    const q = query(
      collection(db, 'order_events'),
      where('orderId', '==', orderId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      callback(list);
    });
  }
};
