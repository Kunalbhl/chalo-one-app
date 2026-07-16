import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ErrorService } from './errorService';

export type AuditEvent = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTRATION'
  | 'PROFILE_UPDATE'
  | 'WALLET_FUNDING'
  | 'PAYMENT'
  | 'BOOKING'
  | 'REFERRAL'
  | 'ADMIN_ACTION'
  | 'SUPPORT_TICKET';

export const AuditService = {
  async log(userId: string | null, event: AuditEvent, details: any = {}) {
    try {
      if (!db) return;
      await addDoc(collection(db, 'system_audits'), {
        userId,
        event,
        details,
        timestamp: serverTimestamp(),
        ip: 'CLIENT_IP_PLACEHOLDER', // In a real environment, Cloud Functions handles true IP
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      });
    } catch (error) {
      ErrorService.logError(error, 'AuditService.log', { userId, event });
    }
  }
};
