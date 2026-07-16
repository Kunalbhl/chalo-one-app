import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ErrorService = {
  async logError(error: any, context: string, additionalData?: any) {
    console.error(`[${context}]`, error);
    try {
      if (db) {
        await addDoc(collection(db, 'admin', 'system', 'errors'), {
          message: error.message || String(error),
          stack: error.stack || null,
          context,
          additionalData: additionalData || {},
          timestamp: serverTimestamp(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
        });
      }
    } catch (e) {
      console.error('Failed to log error to Firestore:', e);
    }
  }
};
