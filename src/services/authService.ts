import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ChaloWallet, AppPreferences } from '../types';

export const AuthService = {
  /**
   * Register a new user and bootstrap their related collections in Firestore
   */
  async signUp(
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    dob: string = '', 
    gender: string = '', 
    avatarUrl: string = ''
  ): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const createdAt = new Date().toISOString();
    const lastLogin = createdAt;

    // 1. Create Profile document: users/{uid} - STORE ONLY the specified 10 fields!
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      name,
      email,
      phone,
      dob,
      gender,
      photoURL: avatarUrl,
      role: 'user',
      createdAt,
      lastLogin,
      emailVerified: user.emailVerified
    });

    // 1.5 Create referral code lookup mapping in a separate collection: referral_codes/{code}
    const referralCode = `CHALO${user.uid.substring(user.uid.length - 5).toUpperCase()}`;
    await setDoc(doc(db, 'referral_codes', referralCode), {
      userId: user.uid,
      email: email,
      name: name
    });

    // 2. Create Wallet document: wallets/{uid}
    const wallet: ChaloWallet = {
      points: 4200, // starter points
      balance: 350.00, // starter balance
      history: [
        {
          id: `TXN-WELCOME-${Date.now()}`,
          description: 'Referral signup welcome bonus',
          type: 'credit',
          amount: 100.00,
          pointsSpentOrEarned: 2000,
          timestamp: new Date().toLocaleDateString('en-IN')
        }
      ]
    };
    await setDoc(doc(db, 'wallets', user.uid), wallet);

    // 3. Create AppPreferences document: preferences/{uid}
    const preferences: AppPreferences = {
      food: ['Zomato', 'Swiggy'],
      mart: ['Blinkit', 'Zepto', 'Instamart'],
      rides: ['Uber', 'Ola', 'Rapido'],
      stays: ['Booking.com', 'Agoda'],
      preferenceMode: 'cheapest',
      defaultFoodType: 'Non-Veg',
      biometricsEnabled: false,
      biometricMode: 'fingerprint',
      txBiometricsEnabled: false,
      securityPin: '1234'
    };
    await setDoc(doc(db, 'preferences', user.uid), preferences);

    // 4. Create Notification document: notifications/{uid}
    const welcomeNotification = {
      userId: user.uid,
      unreadCount: 1,
      list: [
        {
          id: `NOTIF-WELCOME-${Date.now()}`,
          title: 'Welcome to Chalo OneAI!',
          message: 'Your production account has been activated. Manage rides, food, grocery and hotel bookings in one single screen!',
          timestamp: new Date().toLocaleString(),
          isRead: false,
          category: 'system'
        }
      ]
    };
    await setDoc(doc(db, 'notifications', user.uid), welcomeNotification);

    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn("Could not send email verification link:", e);
    }

    return user;
  },

  /**
   * Log in an existing user
   */
  async login(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update lastLogin and emailVerified fields inside users/{uid}
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
        emailVerified: user.emailVerified
      }, { merge: true });
    } catch (e) {
      console.warn("Could not update lastLogin in Firestore:", e);
    }

    return user;
  },

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Trigger a password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Subscribe to authentication changes
   */
  onAuthChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
};
