import { db } from '../firebase';
import { doc, runTransaction, collection, query, limit, getDocs, writeBatch } from 'firebase/firestore';

export const UserIdentityService = {
  /**
   * Generates a sequential internal User ID safely handling concurrency.
   * Format: CH00000001
   */
  async generateInternalIdentity(fullName: string): Promise<{ internalUserId: string, referralCode: string, sequenceNumber: number }> {
    if (!db) throw new Error("Firestore not initialized");
    const counterRef = doc(db, 'system', 'counters');

    const sequenceNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextVal = 1;
      
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { lastUserNumber: 1 }, { merge: true });
      } else {
        const data = counterDoc.data();
        nextVal = (data.lastUserNumber || 0) + 1;
        transaction.update(counterRef, { lastUserNumber: nextVal });
      }
      return nextVal;
    });

    const paddedSeq = sequenceNumber.toString().padStart(8, '0');
    const internalUserId = `CH${paddedSeq}`;

    // Format referral code: First name, uppercase, no special chars, max 10 chars
    let firstName = (fullName || 'USER').split(' ')[0] || 'USER';
    firstName = firstName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 10);
    if (!firstName) firstName = 'USER';
    
    const referralCode = `CHALO-${firstName}-${paddedSeq}`;

    return { internalUserId, referralCode, sequenceNumber };
  },

  /**
   * Migrates legacy users lacking an internalUserId.
   * Can be safely resumed if interrupted.
   */
  async migrateLegacyUsers(batchSize = 100): Promise<{ success: boolean, migratedCount: number, message?: string }> {
    if (!db) return { success: false, migratedCount: 0, message: "Firestore not initialized" };
    
    try {
      const usersRef = collection(db, 'users');
      // In a robust implementation, we would query `where('internalUserId', '==', null)` 
      // but Firestore requires custom indexes or doesn't support "is null" broadly.
      // We'll scan a batch of users and update those missing the ID.
      const snapshot = await getDocs(usersRef); 
      
      let migratedCount = 0;
      let currentBatch = writeBatch(db);
      let operationsInBatch = 0;

      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        
        if (!data.internalUserId) {
          const identity = await this.generateInternalIdentity(data.name || data.email || 'USER');
          
          const updates: any = {
            internalUserId: identity.internalUserId,
          };
          
          // Never overwrite existing referral code
          if (!data.referralCode) {
             updates.referralCode = identity.referralCode;
          }

          const nameParts = (data.name || '').split(' ');
          if (!data.firstName) updates.firstName = nameParts[0] || '';
          if (!data.lastName) updates.lastName = nameParts.slice(1).join(' ') || '';
          if (!data.firebaseUid) updates.firebaseUid = userDoc.id;
          
          currentBatch.update(userDoc.ref, updates);
          operationsInBatch++;
          migratedCount++;

          // Also update referral mappings securely if new code was created
          if (!data.referralCode) {
             const refCodeRef = doc(db, 'referral_codes', identity.referralCode);
             currentBatch.set(refCodeRef, {
               userId: userDoc.id,
               email: data.email || '',
               name: data.name || '',
               internalUserId: identity.internalUserId,
               createdAt: data.createdAt || new Date()
             }, { merge: true });
             operationsInBatch++;
          }

          if (operationsInBatch >= 400) {
             await currentBatch.commit();
             currentBatch = writeBatch(db);
             operationsInBatch = 0;
          }
        }
      }

      if (operationsInBatch > 0) {
         await currentBatch.commit();
      }

      return { success: true, migratedCount };
    } catch(e: any) {
      console.error("Migration failed:", e);
      return { success: false, migratedCount: 0, message: e.message };
    }
  }
};
