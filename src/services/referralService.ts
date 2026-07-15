import { FirestoreService } from './firestoreService';
import { WalletService } from './walletService';
import { NotificationService } from './notificationService';
import { ReferralState } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const ReferralService = {
  /**
   * Subscribe to referral stats in Firestore
   */
  subscribe(userId: string, onUpdate: (data: ReferralState | null) => void): () => void {
    return FirestoreService.subscribeDocument<ReferralState>('referrals', userId, onUpdate);
  },

  /**
   * Initialize a referral document for a user
   */
  async initializeReferral(userId: string, referralCode: string): Promise<void> {
    const defaultState: ReferralState = {
      code: referralCode,
      pointsEarned: 0,
      signupsCount: 0,
      weeklyLeaderboard: [],
      monthlyLeaderboard: [],
      allTimeLeaderboard: []
    };
    await FirestoreService.setDocument('referrals', userId, defaultState);
  },

  /**
   * Look up a user by their referral code
   */
  async findUserByReferralCode(code: string): Promise<string | null> {
    try {
      const docSnap = await getDoc(doc(db, 'referral_codes', code.trim().toUpperCase()));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data?.userId || null;
      }
      return null;
    } catch (e) {
      console.error("Error looking up referral code:", e);
      return null;
    }
  },

  /**
   * Process a referral reward when a new user signs up
   */
  async rewardReferrer(referrerUid: string, newUserName: string): Promise<void> {
    try {
      // 1. Fetch current referral stats for referrer
      const referralDoc = await FirestoreService.getDocument<ReferralState>('referrals', referrerUid);
      const signupsCount = (referralDoc?.signupsCount || 0) + 1;
      const pointsEarned = (referralDoc?.pointsEarned || 0) + 4000; // Reward 4000 points (worth Rs 200)

      // 2. Update referral document
      await FirestoreService.setDocument('referrals', referrerUid, {
        signupsCount,
        pointsEarned
      });

      // 3. Reward points to referrer wallet
      await WalletService.rewardPoints(referrerUid, 4000, `Referral bonus for inviting ${newUserName}`);

      // 4. Notify referrer
      await NotificationService.addNotification(
        referrerUid,
        'Referral Bonus Earned! 🎉',
        `Your friend ${newUserName} has registered using your link. 4,000 points added to your wallet!`,
        'wallet'
      );
    } catch (e) {
      console.error("Failed to reward referrer:", e);
    }
  }
};
