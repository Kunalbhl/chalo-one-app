import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  runTransaction, serverTimestamp, query, where, orderBy, onSnapshot, arrayUnion, writeBatch
} from 'firebase/firestore';
import { OrderService, OrderStatus } from './orderService';
import { WalletService } from './walletService';
import { NotificationService } from './notificationService';
import { DriverService, DriverStatus } from './driverService';
import { ErrorService } from './errorService';

export interface OrderReview {
  reviewId: string;
  orderId: string;
  userId: string;
  userName: string;
  partnerId: string;
  driverId?: string;
  restaurantRating: number;
  driverRating?: number;
  deliveryRating?: number;
  foodRating?: number;
  comment: string;
  images?: string[];
  ownerReply?: string;
  ownerRepliedAt?: any;
  isAbuseReported?: boolean;
  abuseReportReason?: string;
  verifiedPurchase: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  type: 'restaurant' | 'dish' | 'stay' | 'route';
  itemId: string;
  name: string;
  image?: string;
  metadata?: any;
  createdAt: any;
}

export interface SupportChat {
  chatId: string;
  orderId: string;
  userId: string;
  partnerId?: string;
  driverId?: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Closed';
  assignedAdminId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface SupportChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'merchant' | 'driver' | 'admin';
  content: string;
  attachments?: { url: string; name: string; type: string }[];
  voiceNoteUrl?: string;
  createdAt: any;
}

export const LiveOperationsService = {

  // ==========================================
  // 1. LIVE ORDER TRACKING & TELEMETRY SIMULATION
  // ==========================================

  /**
   * Periodically updates the driver coordinates, bearing, and speed
   * in Firestore to simulate realistic real-time telemetry movement.
   */
  async updateLiveTelemetry(
    orderId: string,
    driverId: string,
    lat: number,
    lng: number,
    speed: number = 40,
    bearing: number = 0
  ): Promise<void> {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', orderId);
    const driverLocRef = doc(db, 'driver_locations', driverId);

    const telemetry = {
      latitude: lat,
      longitude: lng,
      speed,
      bearing,
      updatedAt: new Date().toISOString()
    };

    batch.update(orderRef, {
      driverLocation: telemetry,
      updatedAt: serverTimestamp()
    });

    batch.set(driverLocRef, {
      driverId,
      ...telemetry,
      status: DriverStatus.Assigned,
      activeOrderId: orderId,
      timestamp: serverTimestamp()
    }, { merge: true });

    await batch.commit();
  },

  /**
   * Recalculate route and return direct path array and updated distance/ETA.
   */
  recalculateRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    speedKmh: number = 30
  ) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    
    // Create 10 intermediate coordinates for smooth path tracking
    const path = [];
    for (let i = 0; i <= 10; i++) {
      const step = i / 10;
      path.push({
        lat: start.lat + latDiff * step,
        lng: start.lng + lngDiff * step
      });
    }

    // Direct Haversine calculation
    const R = 6371; // Earth's radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    const etaMinutes = speedKmh > 0 ? Math.round((distanceKm / speedKmh) * 60) : 0;

    return {
      path,
      distanceKm,
      etaMinutes
    };
  },

  // ==========================================
  // 2. CUSTOMER SUPPORT & CHAT ENGINE
  // ==========================================

  /**
   * Get or create a support chat ticket session for a specific order.
   */
  async getOrCreateSupportChat(
    orderId: string,
    userId: string,
    partnerId?: string,
    driverId?: string
  ): Promise<string> {
    const chatId = `CHAT-${orderId}`;
    const chatRef = doc(db, 'support_chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        chatId,
        orderId,
        userId,
        partnerId: partnerId || null,
        driverId: driverId || null,
        status: 'Open',
        assignedAdminId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Auto Ticket Event Log
      await OrderService.logOrderEvent(
        orderId,
        OrderStatus.RefundRequested,
        'Support Engine',
        'Auto Support Ticket Session established for live resolution.',
        null,
        'Support Room Created'
      );
    }

    return chatId;
  },

  /**
   * Post a real-time message inside an active support session thread.
   */
  async sendSupportChatMessage(
    chatId: string,
    senderId: string,
    senderType: SupportChatMessage['senderType'],
    content: string,
    attachments?: SupportChatMessage['attachments'],
    voiceNoteUrl?: string
  ): Promise<void> {
    const messageId = `MSG-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const msgRef = doc(db, `support_chats/${chatId}/messages`, messageId);

    const messagePayload: SupportChatMessage = {
      messageId,
      chatId,
      senderId,
      senderType,
      content,
      attachments: attachments || [],
      voiceNoteUrl: voiceNoteUrl || '',
      createdAt: new Date().toISOString()
    };

    await setDoc(msgRef, messagePayload);

    // Update parent ticket updated timestamp
    await updateDoc(doc(db, 'support_chats', chatId), {
      updatedAt: serverTimestamp()
    });

    // Handle instant automated push notifications
    const chatSnap = await getDoc(doc(db, 'support_chats', chatId));
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const recipientId = senderType === 'user' ? (chatData.assignedAdminId || 'admin') : chatData.userId;
      
      if (recipientId && recipientId !== 'admin') {
        await NotificationService.addNotification(
          recipientId,
          `💬 New Support Message`,
          content.slice(0, 60) + (content.length > 60 ? '...' : ''),
          'system',
          { icon: '💬' }
        );
      }
    }
  },

  /**
   * Escalate active ticket to core administrative tier.
   */
  async escalateSupportChat(chatId: string, reason: string): Promise<void> {
    await updateDoc(doc(db, 'support_chats', chatId), {
      status: 'Escalated',
      escalationReason: reason,
      updatedAt: serverTimestamp()
    });
  },

  // ==========================================
  // 3. RULE-BASED CANCELLATION & REFUND ENGINE
  // ==========================================

  /**
   * Computes rule-based cancellation charges and refund breakdowns.
   */
  calculateCancellationRefund(paidAmount: number, status: string): {
    cancellationFee: number;
    refundAmount: number;
    refundPct: number;
    ruleApplied: string;
  } {
    // 1. Before Accepted (Draft, Confirmed) -> 100% Refund, Free Cancellation
    if (status === 'Draft' || status === 'Confirmed' || status === 'Pending Payment') {
      return {
        cancellationFee: 0,
        refundAmount: paidAmount,
        refundPct: 100,
        ruleApplied: 'Pre-acceptance Grace: 100% refund authorized.'
      };
    }

    // 2. During Preparation (Accepted, Preparing, Packed, Ready)
    // 50% penalty for wasted food ingredients or preparational overhead
    if (status === 'Accepted' || status === 'Preparing' || status === 'Packed' || status === 'Ready') {
      const fee = Math.round(paidAmount * 0.5);
      return {
        cancellationFee: fee,
        refundAmount: paidAmount - fee,
        refundPct: 50,
        ruleApplied: 'Food Preparation Stage Penalty: 50% cancellation fee deducted due to ingredient spoilage.'
      };
    }

    // 3. After Pickup/Dispatched (Driver Assigned, Picked Up, Near Customer, Delivered)
    // 100% penalty, no refund
    return {
      cancellationFee: paidAmount,
      refundAmount: 0,
      refundPct: 0,
      ruleApplied: 'Transit Stage Penalty: 100% cancellation penalty applied. Out for delivery.'
    };
  },

  /**
   * Processes rule-based cancellation refund back to wallet or Razorpay mock.
   */
  async processOrderCancellation(
    orderId: string,
    userId: string,
    reason: string
  ): Promise<{
    success: boolean;
    cancellationFee: number;
    refundAmount: number;
    refundId?: string;
    message: string;
  }> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order context does not exist.');
      }

      const orderData = orderSnap.data();
      const currentStatus = orderData.status;
      const paidAmount = orderData.totalAmount || orderData.totalPrice || 0;
      const paymentMethod = orderData.paymentMethod || 'wallet';

      const calc = this.calculateCancellationRefund(paidAmount, currentStatus);

      // Perform transaction-based status update & refund execution
      await runTransaction(db, async (transaction) => {
        // Double check status hasn't moved
        const freshSnap = await transaction.get(orderRef);
        const freshStatus = freshSnap.data()?.status;
        if (freshStatus === 'Cancelled') {
          throw new Error('Order has already been cancelled.');
        }

        // Cancel the order
        transaction.update(orderRef, {
          status: 'Cancelled',
          cancellationReason: reason,
          cancellationFee: calc.cancellationFee,
          refundAmount: calc.refundAmount,
          updatedAt: serverTimestamp()
        });

        // Credit to wallet if refund amount > 0
        if (calc.refundAmount > 0) {
          if (paymentMethod === 'wallet') {
            const walletRef = doc(db, 'wallets', userId);
            const walletSnap = await transaction.get(walletRef);
            if (walletSnap.exists()) {
              const currentBal = walletSnap.data().balance || 0;
              transaction.update(walletRef, {
                balance: currentBal + calc.refundAmount,
                lastUpdated: serverTimestamp()
              });

              // Write wallet history
              const txId = `TXN-REFUND-${Date.now()}`;
              const walletHistoryRef = doc(db, `wallets/${userId}/history`, txId);
              transaction.set(walletHistoryRef, {
                id: txId,
                type: 'credit',
                amount: calc.refundAmount,
                description: `Cancellation Refund for Order #${orderId.slice(-5).toUpperCase()}`,
                timestamp: new Date().toLocaleString('en-IN')
              }, { merge: true });
            }
          } else {
            // Razorpay Reversal Pipeline Mock
            const refundId = `RFND-${Date.now()}`;
            const refundRef = doc(db, 'refunds', refundId);
            transaction.set(refundRef, {
              id: refundId,
              orderId,
              customerId: userId,
              amount: calc.refundAmount,
              reason: `Cancellation: ${reason}`,
              status: 'Approved',
              gateway: 'razorpay',
              razorpayRefundId: `rfnd_${crypto.randomUUID().slice(0, 8)}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      });

      // Write logs
      await OrderService.logOrderEvent(
        orderId,
        'Cancelled',
        'Customer',
        reason,
        null,
        `Cancellation fee: ₹${calc.cancellationFee}, Refund: ₹${calc.refundAmount}`
      );

      // Notify user
      await NotificationService.addNotification(
        userId,
        'Order Cancelled 🛑',
        `Your order has been cancelled. Refund of ₹${calc.refundAmount} has been processed back to your payment mode.`,
        'system'
      );

      // Play Sound/Chime locally if inside browser
      this.playChimeTone('cancel');

      return {
        success: true,
        cancellationFee: calc.cancellationFee,
        refundAmount: calc.refundAmount,
        message: 'Order cancelled successfully and refund processed.'
      };
    } catch (e: any) {
      ErrorService.logError(e, 'LiveOperationsService.processOrderCancellation', { orderId });
      return {
        success: false,
        cancellationFee: 0,
        refundAmount: 0,
        message: e.message || 'Failed to cancel order.'
      };
    }
  },

  // ==========================================
  // 4. RATINGS & REVIEWS ENGINE
  // ==========================================

  async submitReview(review: Omit<OrderReview, 'reviewId' | 'createdAt' | 'updatedAt' | 'verifiedPurchase'>): Promise<string> {
    const reviewId = `REV-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const reviewRef = doc(db, 'reviews', reviewId);

    const payload: OrderReview = {
      ...review,
      reviewId,
      verifiedPurchase: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(reviewRef, payload, { merge: true });

    // Update restaurant average rating
    const partnerRef = doc(db, 'restaurants', review.partnerId);
    const partnerSnap = await getDoc(partnerRef);
    if (partnerSnap.exists()) {
      const data = partnerSnap.data();
      const currentRating = data.rating || 4.5;
      const currentCount = data.reviewsCount || 10;
      const newRating = parseFloat(((currentRating * currentCount + review.restaurantRating) / (currentCount + 1)).toFixed(2));
      await updateDoc(partnerRef, {
        rating: newRating,
        reviewsCount: currentCount + 1
      });
    }

    // Update driver rating if any
    if (review.driverId && review.driverRating) {
      const driverRef = doc(db, 'driver_locations', review.driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const data = driverSnap.data();
        const curRating = data.rating || 4.8;
        const curCount = data.reviewsCount || 15;
        const newDrivesRating = parseFloat(((curRating * curCount + review.driverRating) / (curCount + 1)).toFixed(2));
        await updateDoc(driverRef, {
          rating: newDrivesRating,
          reviewsCount: curCount + 1
        });
      }
    }

    return reviewId;
  },

  async submitOwnerReply(reviewId: string, partnerId: string, replyText: string): Promise<void> {
    await updateDoc(doc(db, 'reviews', reviewId), {
      ownerReply: replyText,
      ownerRepliedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
  },

  async reportReviewAbuse(reviewId: string, reportedBy: string, reason: string): Promise<void> {
    await updateDoc(doc(db, 'reviews', reviewId), {
      isAbuseReported: true,
      abuseReportReason: reason,
      reportedBy,
      updatedAt: serverTimestamp()
    });
  },

  // ==========================================
  // 5. REORDER & FAVORITES PERSISTENCE
  // ==========================================

  async reorder(orderId: string, userId: string): Promise<string> {
    const origRef = doc(db, 'orders', orderId);
    const snap = await getDoc(origRef);
    if (!snap.exists()) {
      throw new Error("Original order not found.");
    }
    const data = snap.data();
    const newOrderId = `CHALO-ORD-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const newRef = doc(db, 'orders', newOrderId);

    const duplicated = {
      ...data,
      id: newOrderId,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'Draft',
      statusLabel: 'Draft',
      driverId: null,
      driverLocation: null,
      deliveryOtp: parseInt(crypto.randomUUID().slice(0, 4), 16).toString()
    };

    await setDoc(newRef, duplicated);
    return newOrderId;
  },

  async toggleFavorite(
    userId: string,
    type: FavoriteItem['type'],
    itemId: string,
    name: string,
    image?: string,
    metadata?: any
  ): Promise<boolean> {
    const favId = `FAV-${userId}-${itemId}`;
    const favRef = doc(db, 'favorites', favId);
    const snap = await getDoc(favRef);

    if (snap.exists()) {
      await setDoc(favRef, {}, { merge: false }); // Empty or deletes
      return false; // Removed
    } else {
      await setDoc(favRef, {
        id: favId,
        userId,
        type,
        itemId,
        name,
        image: image || '',
        metadata: metadata || null,
        createdAt: new Date().toISOString()
      });
      return true; // Added
    }
  },

  async getUserFavorites(userId: string, type?: FavoriteItem['type']): Promise<FavoriteItem[]> {
    const favsCol = collection(db, 'favorites');
    let q = query(favsCol, where('userId', '==', userId));
    if (type) {
      q = query(favsCol, where('userId', '==', userId), where('type', '==', type));
    }
    const snap = await getDocs(q);
    const list: FavoriteItem[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.id) {
        list.push(data as FavoriteItem);
      }
    });
    return list;
  },

  // ==========================================
  // 6. ADVANCED DELIVERY EXPERIENCE & VERIFICATION
  // ==========================================

  /**
   * Verified completion of delivery with OTP handshake
   */
  async verifyDeliveryAndComplete(
    orderId: string,
    enteredOtp: string,
    signatureCoords?: { x: number; y: number }[],
    proofPhotoUrl?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order does not exist.');
      }

      const orderData = orderSnap.data();
      const actualOtp = orderData.deliveryOtp;

      if (actualOtp && actualOtp !== enteredOtp) {
        return { success: false, message: 'Invalid delivery OTP verification failed.' };
      }

      // Safe state updates
      await updateDoc(orderRef, {
        status: OrderStatus.Completed,
        deliveryProofPhoto: proofPhotoUrl || '',
        deliverySignature: signatureCoords || [],
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Free driver availability status
      if (orderData.driverId) {
        await updateDoc(doc(db, 'driver_locations', orderData.driverId), {
          status: DriverStatus.Available,
          activeOrderId: null,
          updatedAt: serverTimestamp()
        });
      }

      await OrderService.logOrderEvent(
        orderId,
        OrderStatus.Completed,
        'Driver',
        'Delivery completed. OTP handshake successful.',
        null,
        'Order fully satisfied.'
      );

      // Play Sound
      this.playChimeTone('complete');

      return { success: true, message: 'Order delivered successfully.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Verification failed.' };
    }
  },

  // ==========================================
  // 7. MERCHANT SETTINGS & AUTO TIMINGS SCHEDULE
  // ==========================================

  async updateMerchantOperationalSettings(
    partnerId: string,
    updates: {
      isBusy?: boolean;
      temporaryClose?: boolean;
      openingTime?: string; // "HH:MM" 24h
      closingTime?: string; // "HH:MM" 24h
    }
  ): Promise<void> {
    const restRef = doc(db, 'restaurants', partnerId);
    await updateDoc(restRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  checkMerchantTimingStatus(openingTime?: string, closingTime?: string): boolean {
    if (!openingTime || !closingTime) return true; // Default open
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  },

  // ==========================================
  // 8. AUDIO SYNTHESIS SOUND NOTIFICATIONS (No raw assets required)
  // ==========================================

  playChimeTone(type: 'alert' | 'complete' | 'cancel'): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'complete') {
        // Double sweet chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'cancel') {
        // Descending warning tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440.00, now); // A4
        osc.frequency.linearRampToValueAtTime(220.00, now + 0.4);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // High alert ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880.00, now); // A5
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (err) {
      console.warn('Synthesized web audio alert failed to execute:', err);
    }
  }
};
