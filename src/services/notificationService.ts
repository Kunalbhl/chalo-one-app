import { safeStorage, safeSessionStorage } from '../utils/storage';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { db, app } from '../firebase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'rides' | 'food' | 'mart' | 'stays' | 'intercity' | 'wallet' | 'system';
  icon: string;
  image: string;
  action: string;
  data: any;
  read: boolean;
  createdAt: any;
  // Legacy fields
  message: string;
  timestamp: string;
  isRead: boolean;
  category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity' | 'wallet' | 'system';
}

export interface NotificationsDocument {
  userId: string;
  unreadCount: number;
  list: AppNotification[];
}

// Memory caches to prevent duplicate listeners
let activeNotificationListener: (() => void) | null = null;
let currentNotificationUserId: string | null = null;
let activeMessagingListener: (() => void) | null = null;
const subscribers = new Set<(data: NotificationsDocument | null) => void>();
let lastData: NotificationsDocument | null = null;

// Helpers to extract device metadata safely
function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.indexOf("Opera") > -1 || ua.indexOf('OPR') > -1) return "Opera";
  if (ua.indexOf("Chrome") > -1) return "Chrome";
  if (ua.indexOf("Safari") > -1) return "Safari";
  if (ua.indexOf("Firefox") > -1) return "Firefox";
  if (ua.indexOf("MSIE") > -1 || !!(document as any).documentMode) return "IE";
  return "Browser";
}

function getPlatformName(): string {
  if (typeof window === 'undefined') return 'Web';
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return "iOS";
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) return "macOS";
  if (/Windows|Win32|Win64|Windows NT/.test(userAgent)) return "Windows";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Web";
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown-device';
  let deviceId = safeStorage.getItem('chalo_device_id');
  if (!deviceId) {
    deviceId = `DEV-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    safeStorage.setItem('chalo_device_id', deviceId);
  }
  return deviceId;
}

export const NotificationService = {
  /**
   * Request notification permission once and obtain the FCM token
   */
  async requestFCMToken(userId: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn("⚠️ Firebase Cloud Messaging is not supported in this environment.");
        return null;
      }

      const messaging = getMessaging(app);

      // Check permission status
      if (Notification.permission === 'denied') {
        console.log("Respecting user choice: Notification permission previously denied.");
        return null;
      }

      // Track if we already asked to avoid spamming
      const alreadyAsked = safeStorage.getItem('chalo_fcm_permission_requested');
      if (Notification.permission === 'default' && alreadyAsked === 'true') {
        console.log("Permission was skipped by user. Not spamming prompt.");
        return null;
      }

      // Ask permission
      safeStorage.setItem('chalo_fcm_permission_requested', 'true');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log("Notification permission was not granted.");
        return null;
      }

      // Register Service Worker explicitly to avoid default registration race conditions
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✓ FCM Service Worker verified/registered with scope:', reg.scope);
        } catch (swErr) {
          console.warn('FCM Service Worker registration failed during token request:', swErr);
        }
      }

      // Obtain FCM token (use standard public sandbox VAPID or let FCM fetch default)
      const token = await getToken(messaging, {
        vapidKey: 'BDb0G6h-3YyH8oY_O6pQkY6j2s1bM5h8v8G6l_O7Yh8pG6h-3YyH8oY' // Public VAPID or auto-assigned
      });

      if (token) {
        console.log("✓ FCM Device Token acquired successfully");
        await this.syncDeviceToken(userId, token);
        return token;
      }
      return null;
    } catch (err) {
      console.warn("Could not acquire FCM token:", err);
      return null;
    }
  },

  /**
   * Sync active FCM token to users/{uid}/devices/{deviceId}
   */
  async syncDeviceToken(userId: string, token: string): Promise<void> {
    try {
      const deviceId = getOrCreateDeviceId();
      const deviceRef = doc(db, 'users', userId, 'devices', deviceId);

      await setDoc(deviceRef, {
        token,
        platform: getPlatformName(),
        browser: getBrowserName(),
        deviceName: `${getBrowserName()} on ${getPlatformName()}`,
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        active: true
      }, { merge: true });

      // Clean up duplicate/stale tokens inside the user devices subcollection
      const devicesCol = collection(db, 'users', userId, 'devices');
      const q = query(devicesCol, where('token', '==', token));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      let hasDeletes = false;

      snap.docs.forEach(d => {
        if (d.id !== deviceId) {
          batch.delete(d.ref);
          hasDeletes = true;
        }
      });

      if (hasDeletes) {
        await batch.commit();
        console.log("✓ Duplicate/stale device tokens removed successfully");
      }
    } catch (e) {
      console.warn("Failed to sync device token to Firestore:", e);
    }
  },

  /**
   * Initialize and attach Foreground Messaging Listener
   */
  async initializeForegroundListener(userId: string): Promise<void> {
    try {
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(app);

      // Remove existing foreground messaging listener if any
      if (activeMessagingListener) {
        activeMessagingListener();
        activeMessagingListener = null;
      }

      activeMessagingListener = onMessage(messaging, (payload) => {
        console.log('✓ Foreground message received: ', payload);

        // Extract message contents
        const title = payload.notification?.title || payload.data?.title || 'Chalo One Alert';
        const body = payload.notification?.body || payload.data?.body || 'You received a new update.';
        const type = (payload.data?.type || 'system') as any;

        // Display browser/toast notification
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: payload.notification?.icon || payload.data?.icon || '/assets/logo.png',
          });
        }

        // Automatically write foreground notification into Firestore!
        this.addNotification(userId, title, body, type, {
          icon: payload.notification?.icon || payload.data?.icon,
          image: payload.notification?.image || payload.data?.image,
          action: payload.data?.click_action || (payload.notification as any)?.click_action,
          data: payload.data
        }).catch(err => {
          console.warn("Failed to auto-write foreground notification to Firestore:", err);
        });
      });

      console.log("✓ Foreground messaging listener initialized successfully");
    } catch (err) {
      console.warn("Could not register foreground listener:", err);
    }
  },

  /**
   * Real-time listeners for subcollection users/{userId}/notifications/{notificationId}
   */
  subscribe(userId: string, onUpdate: (data: NotificationsDocument | null) => void): () => void {
    subscribers.add(onUpdate);
    
    if (lastData && currentNotificationUserId === userId) {
      onUpdate(lastData);
    }

    if (!activeNotificationListener || currentNotificationUserId !== userId) {
      if (activeNotificationListener) {
        activeNotificationListener();
      }
      currentNotificationUserId = userId;

      const colRef = collection(db, 'users', userId, 'notifications');
      const q = query(colRef, orderBy('createdAt', 'desc'));

      activeNotificationListener = onSnapshot(q, (snap) => {
        const list: AppNotification[] = snap.docs.map(doc => {
          const data = doc.data();
          const rawDate = data.createdAt;
          let timestamp = '';
          if (rawDate) {
            if (rawDate.toDate) {
              timestamp = rawDate.toDate().toLocaleString('en-IN');
            } else {
              timestamp = new Date(rawDate).toLocaleString('en-IN');
            }
          } else {
            timestamp = new Date().toLocaleString('en-IN');
          }

          return {
            id: doc.id,
            title: data.title || '',
            body: data.body || '',
            type: data.type || 'system',
            icon: data.icon || '',
            image: data.image || '',
            action: data.action || '',
            data: data.data || null,
            read: !!data.read,
            createdAt: data.createdAt || null,
            // Legacy mapping
            message: data.body || data.message || '',
            timestamp,
            isRead: !!data.read,
            category: data.type || 'system'
          };
        });

        const unreadCount = list.filter(n => !n.isRead).length;
        lastData = { userId, unreadCount, list };
        subscribers.forEach(sub => sub(lastData));

        // Sync to legacy notifications endpoint in background to prevent side effects
        setDoc(doc(db, 'notifications', userId), {
          userId,
          unreadCount,
          list: list.slice(0, 50) // Cache latest 50 for fallback
        }, { merge: true }).catch(() => {});

      }, (err) => {
        console.warn("Error listening to notifications:", err);
      });
    }

    return () => {
      subscribers.delete(onUpdate);
      if (subscribers.size === 0) {
        if (activeNotificationListener) {
          activeNotificationListener();
          activeNotificationListener = null;
        }
        currentNotificationUserId = null;
        lastData = null;
      }
    };
  },

  /**
   * Save a notification record directly under users/{uid}/notifications/{notificationId}
   */
  async addNotification(
    userId: string, 
    title: string, 
    body: string, 
    type: AppNotification['category'],
    extra: { icon?: string; image?: string; action?: string; data?: any } = {}
  ): Promise<void> {
    const notifId = `NOTIF-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
    const docRef = doc(db, 'users', userId, 'notifications', notifId);

    await setDoc(docRef, {
      id: notifId,
      title,
      body,
      type,
      icon: extra.icon || '',
      image: extra.image || '',
      action: extra.action || '',
      data: extra.data || null,
      read: false,
      createdAt: serverTimestamp()
    });
  },

  /**
   * Mark all notifications or a specific notification as read in Firestore
   */
  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    if (notificationId) {
      const docRef = doc(db, 'users', userId, 'notifications', notificationId);
      await setDoc(docRef, { read: true }, { merge: true });
    } else {
      const colRef = collection(db, 'users', userId, 'notifications');
      const q = query(colRef, where('read', '==', false));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
    }
  },

  /**
   * Delete a notification from Firestore subcollection
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(docRef);
  },

  // ==========================================
  // SYSTEM AUTOMATED EVENTS TRIGGERS
  // ==========================================

  async notifyRegistration(userId: string): Promise<void> {
    await this.addNotification(
      userId,
      'Registration Successful 🚀',
      'Welcome to Chalo One Super-App! Your unified transportation and lifestyle account has been successfully created.',
      'system'
    );
  },

  async notifyWelcome(userId: string, userName: string): Promise<void> {
    await this.addNotification(
      userId,
      `Welcome to Chalo One, ${userName}! 👋`,
      'Ready to simplify your daily commute, food delivery, grocery, and hotel bookings? Let\'s take your first ride!',
      'system'
    );
  },

  async notifyReferralJoined(userId: string, friendName: string, pointsEarned: number): Promise<void> {
    await this.addNotification(
      userId,
      'Referral Successful! 🎉',
      `Your friend ${friendName} has registered using your referral link. You've earned ${pointsEarned.toLocaleString()} points!`,
      'system'
    );
  },

  async notifyWalletCredit(userId: string, amount: number, points: number, description: string): Promise<void> {
    const details = amount > 0 ? `₹${amount}` : `${points} points`;
    await this.addNotification(
      userId,
      'Wallet Credited ⚡',
      `Your wallet has been credited with ${details} for: ${description}.`,
      'wallet'
    );
  },

  async notifyWalletDebit(userId: string, amount: number, points: number, description: string): Promise<void> {
    const details = amount > 0 ? `₹${amount}` : `${points} points`;
    await this.addNotification(
      userId,
      'Wallet Debited 💸',
      `Your wallet has been debited by ${details} for: ${description}.`,
      'wallet'
    );
  },

  async notifyRideBooked(userId: string, platform: string, vehicleType: string, destination: string): Promise<void> {
    await this.addNotification(
      userId,
      'Ride Booked! 🚗',
      `Your ${platform} ${vehicleType} to ${destination} has been booked successfully. Your driver is on the way!`,
      'rides'
    );
  },

  async notifyRideCancelled(userId: string, platform: string, vehicleType: string): Promise<void> {
    await this.addNotification(
      userId,
      'Ride Cancelled 🛑',
      `Your ${platform} ${vehicleType} booking has been cancelled. Any deducted amount has been refunded to your wallet.`,
      'rides'
    );
  },

  async notifyFoodOrder(userId: string, platform: string, itemsDescription: string): Promise<void> {
    await this.addNotification(
      userId,
      'Food Order Confirmed! 🍔',
      `Your order from ${platform} for "${itemsDescription}" has been received and is being prepared.`,
      'food'
    );
  },

  async notifyHotelBooking(userId: string, platform: string, hotelName: string, date: string): Promise<void> {
    await this.addNotification(
      userId,
      'Hotel Booking Confirmed! 🏨',
      `Your booking at ${hotelName} via ${platform} for ${date} has been confirmed.`,
      'stays'
    );
  },

  async notifyProfileUpdated(userId: string): Promise<void> {
    await this.addNotification(
      userId,
      'Profile Updated Securely 🔒',
      'Your profile information, avatar, and security fields have been successfully updated.',
      'system'
    );
  },

  async notifyAdminAnnouncement(userId: string, title: string, body: string): Promise<void> {
    await this.addNotification(
      userId,
      title,
      body,
      'system'
    );
  },

  // ==========================================
  // ADMINISTRATIVE BROADCASTS
  // ==========================================

  async sendAdminBroadcast({
    targets,
    role,
    userIds,
    title,
    body,
    scheduleTime
  }: {
    targets: 'all' | 'role' | 'selected';
    role?: string;
    userIds?: string[];
    title: string;
    body: string;
    scheduleTime?: string | Date;
  }): Promise<{ success: boolean; count: number; scheduled?: boolean }> {
    // 1. Future scheduling support
    if (scheduleTime && new Date(scheduleTime) > new Date()) {
      const bRef = doc(collection(db, 'scheduled_broadcasts'));
      await setDoc(bRef, {
        id: bRef.id,
        targets,
        role: role || null,
        userIds: userIds || null,
        title,
        body,
        scheduleTime: new Date(scheduleTime),
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      return { success: true, count: 0, scheduled: true };
    }

    // 2. Immediate broadcast execution
    let usersQuery;
    if (targets === 'all') {
      usersQuery = collection(db, 'users');
    } else if (targets === 'role' && role) {
      usersQuery = query(collection(db, 'users'), where('role', '==', role));
    } else if (targets === 'selected' && userIds && userIds.length > 0) {
      const batch = writeBatch(db);
      for (const uid of userIds) {
        const notifId = `NOTIF-BROADCAST-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
        const notifRef = doc(db, 'users', uid, 'notifications', notifId);
        batch.set(notifRef, {
          id: notifId,
          title,
          body,
          type: 'system',
          icon: '',
          image: '',
          action: '',
          data: null,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      return { success: true, count: userIds.length };
    } else {
      return { success: false, count: 0 };
    }

    const snap = await getDocs(usersQuery);
    if (snap.empty) {
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    let count = 0;
    for (const d of snap.docs) {
      const uid = d.id;
      const notifId = `NOTIF-BROADCAST-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
      const notifRef = doc(db, 'users', uid, 'notifications', notifId);
      
      batch.set(notifRef, {
        id: notifId,
        title,
        body,
        type: 'system',
        icon: '',
        image: '',
        action: '',
        data: null,
        read: false,
        createdAt: serverTimestamp()
      });
      
      count++;
      if (count % 450 === 0) {
        await batch.commit();
      }
    }
    
    await batch.commit();
    return { success: true, count };
  }
};
