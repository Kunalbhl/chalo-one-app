import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ErrorService } from './errorService';

export const AnalyticsService = {
  async trackEvent(
    eventType: 'USER_SIGNUP' | 'REVENUE' | 'BOOKING' | 'PAYMENT' | 'WALLET_FUNDED' | 'REFERRAL' | 'HOTEL_BOOKING' | 'FOOD_ORDER' | 'MART_ORDER' | 'BILL_PAID',
    value: number = 0,
    metadata: any = {}
  ) {
    try {
      if (!db) return;
      
      const now = new Date();
      const dailyId = now.toISOString().split('T')[0];
      const monthId = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      // Update Daily Stats
      const dailyRef = doc(db, 'admin', 'analytics_daily', 'days', dailyId);
      await setDoc(dailyRef, {
        [eventType]: increment(1),
        [`${eventType}_value`]: increment(value),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Update Monthly Stats
      const monthlyRef = doc(db, 'admin', 'analytics_monthly', 'months', monthId);
      await setDoc(monthlyRef, {
        [eventType]: increment(1),
        [`${eventType}_value`]: increment(value),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Overall System Health
      const healthRef = doc(db, 'admin', 'system_health');
      await setDoc(healthRef, {
        [`total_${eventType.toLowerCase()}`]: increment(1),
        lastActivity: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      ErrorService.logError(error, 'AnalyticsService.trackEvent', { eventType, value, metadata });
    }
  }
};
