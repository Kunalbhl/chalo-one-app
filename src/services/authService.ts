import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { WriteGuard } from './WriteGuard';
import { auth, db } from '../firebase';
import { ChaloWallet, AppPreferences, UserProfile } from '../types';
import { getDefaultRoleForEmail } from '../security/rbac';
import { NotificationService } from './notificationService';
import { UserIdentityService } from './userIdentityService';

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
    const trimmedEmail = email.toLowerCase().trim();
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const user = userCredential.user;
    const uid = user.uid;

    const referralCode = `CHALO${uid.substring(uid.length - 5).toUpperCase()}`;
    const defaultAvatar = avatarUrl.trim() || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Teddy';
    const resolvedRole = getDefaultRoleForEmail(trimmedEmail);

    // 1. Create Profile document: users/{uid} with EXACT requested schema
    const userDocRef = doc(db, 'users', uid);
    const userProfileData = {
      id: uid,
      name,
      email: trimmedEmail,
      phone,
      dob,
      gender,
      avatarUrl: defaultAvatar,
      photoURL: defaultAvatar,
      emailVerified: user.emailVerified,
      role: resolvedRole,
      referralCode,
      savedAddresses: [],
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Use merge:true
    await setDoc(userDocRef, userProfileData, { merge: true });

    // 2. Create Wallet document: wallets/{uid}
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
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
      await setDoc(walletRef, wallet, { merge: true });
    }

    // 3. Create AppPreferences document: preferences/{uid}
    const prefRef = doc(db, 'preferences', uid);
    const prefSnap = await getDoc(prefRef);
    if (!prefSnap.exists()) {
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
      await setDoc(prefRef, preferences, { merge: true });
    }

    // 4. Create real Registration and Welcome notifications
    await NotificationService.notifyRegistration(uid);
    await NotificationService.notifyWelcome(uid, name);

    // 5. Create Referral document: referrals/{uid}
    const referralRef = doc(db, 'referrals', uid);
    const referralSnap = await getDoc(referralRef);
    if (!referralSnap.exists()) {
      const defaultState = {
        code: referralCode,
        pointsEarned: 0,
        signupsCount: 0,
        weeklyLeaderboard: [],
        monthlyLeaderboard: [],
        allTimeLeaderboard: []
      };
      await setDoc(referralRef, defaultState, { merge: true });
    }

    // 6. Create ActivityLogs document: activity_logs/{uid}
    const activityRef = doc(db, 'activity_logs', uid);
    const activitySnap = await getDoc(activityRef);
    if (!activitySnap.exists()) {
      const defaultActivityLogs = {
        userId: uid,
        logs: [
          {
            id: `ACT-WELCOME-${Date.now()}`,
            title: 'Account Created',
            description: 'Successfully initialized Chalo One Super-App secure workspace.',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(activityRef, defaultActivityLogs, { merge: true });
    }

    // Create lookup referral_codes/{code}
    const refCodeRef = doc(db, 'referral_codes', referralCode);
    const refCodeSnap = await getDoc(refCodeRef);
    if (!refCodeSnap.exists()) {
      await setDoc(refCodeRef, {
        userId: uid,
        email: trimmedEmail,
        name: name
      }, { merge: true });
    }

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
    const trimmedEmail = email.toLowerCase().trim();
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const user = userCredential.user;

    // Update lastLogin and emailVerified fields inside users/{uid}
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified,
        updatedAt: serverTimestamp()
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
    try {
      const trimmedEmail = email.trim();
      await sendPasswordResetEmail(auth, trimmedEmail);
    } catch (error: any) {
      console.error(`Firebase App Auth Error Code: ${error.code}, Message: ${error.message}`);
      throw error;
    }
  },

  /**
   * Subscribe to authentication changes
   */
  onAuthChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Complete bootstrap of a user session.
   * Ensures all 6 required documents exist in Firestore:
   * users/{uid}, wallets/{uid}, preferences/{uid}, notifications/{uid}, referrals/{uid}, activity_logs/{uid}
   * If any of these are missing, it creates them.
   * Also ensures all required profile fields are present and valid, and returns the profile.
   */
  async bootstrapUserSession(user: FirebaseUser): Promise<any> {
    const uid = user.uid;
    const email = (user.email || '').toLowerCase().trim();
    
    // 1. Verify and bootstrap users/{uid}
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    let profileData: any = {};
    let finalReferralCode = '';
    let finalInternalUserId = '';
    const defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Teddy';
    const resolvedRole = getDefaultRoleForEmail(email);

    if (!userSnap.exists()) {
      const nameFromEmail = email.split('@')[0];
      const identity = await UserIdentityService.generateInternalIdentity(nameFromEmail);
      finalReferralCode = identity.referralCode;
      finalInternalUserId = identity.internalUserId;
      
      const nameParts = nameFromEmail.split(' ');
      
      profileData = {
        id: uid, // firebaseUid alias
        firebaseUid: uid,
        internalUserId: finalInternalUserId,
        referralCode: finalReferralCode,
        name: nameFromEmail,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: email,
        phone: '',
        dob: '',
        gender: 'Male',
        avatarUrl: defaultAvatar,
        photoURL: defaultAvatar,
        emailVerified: user.emailVerified,
        role: resolvedRole,
        status: 'Active',
        createdBy: 'system',
        savedAddresses: [],
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, profileData, { merge: true });
    } else {
      profileData = userSnap.data();
      // Ensure all fields are valid
      profileData = await this.ensureUserProfileFields(uid, profileData, email);
      finalReferralCode = profileData.referralCode;
      finalInternalUserId = profileData.internalUserId;

      // Update lastLogin on active session bootstrap only once every 24 hours to save DB writes
      const lastLoginDate = profileData.lastLogin?.toDate ? profileData.lastLogin.toDate() : new Date(0);
      const now = new Date();
      const hoursSinceLastLogin = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastLogin > 24) {
        try {
          await WriteGuard.safeSet('users', uid, {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            emailVerified: user.emailVerified
          }, { merge: true, throttleMs: 3600000 });
        } catch(e) {
          console.error("Quota exceeded on lastLogin update", e);
        }
      }
      profileData.lastLogin = new Date(); // local fallback for client UI display immediately
      profileData.emailVerified = user.emailVerified;
    }

    // 2. Verify wallets/{uid}
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
      await setDoc(walletRef, {
        id: uid,
        balance: 500,
        currency: 'INR',
        transactions: [],
        savedCards: [],
        savedUpis: [],
        savedWallets: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // 3. Verify preferences/{uid}
    const prefRef = doc(db, 'preferences', uid);
    const prefSnap = await getDoc(prefRef);
    if (!prefSnap.exists()) {
      await setDoc(prefRef, {
        theme: 'light',
        notifications: true,
        marketing: false,
        prefRides: 'uber',
        prefFood: 'zomato',
        prefMart: 'blinkit',
        prefStays: 'makemytrip',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // 4. Verify/Create Real Registration and Welcome notifications
    const subColRef = collection(db, 'users', uid, 'notifications');
    const existingNotifs = await getDocs(subColRef);
    if (existingNotifs.empty) {
      await NotificationService.notifyRegistration(uid);
      await NotificationService.notifyWelcome(uid, profileData?.name || 'User');
    }

    // 5. Verify referrals/{uid}
    const referralRef = doc(db, 'referrals', uid);
    const referralSnap = await getDoc(referralRef);
    if (!referralSnap.exists()) {
      await setDoc(referralRef, {
        code: finalReferralCode,
        count: 0,
        earnings: 0,
        history: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // 6. Verify activity_logs/{uid}
    const activityRef = doc(db, 'activity_logs', uid);
    const activitySnap = await getDoc(activityRef);
    if (!activitySnap.exists()) {
      await setDoc(activityRef, {
        userId: uid,
        logs: [
          {
            id: `ACT-WELCOME-${Date.now()}`,
            title: "Account Created",
            desc: "Your Chalo One secure login profile has been initiated successfully.",
            timestamp: new Date().toISOString(),
            category: "security",
            ip: "127.0.0.1",
            device: "Web Browser (Chrome/Safari)"
          }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // Also verify referral_codes mapping exists
    if (finalReferralCode) {
      const refCodeRef = doc(db, 'referral_codes', finalReferralCode);
      const refCodeSnap = await getDoc(refCodeRef);
      if (!refCodeSnap.exists()) {
        await setDoc(refCodeRef, {
          userId: uid,
          email: email,
          name: profileData.name || email.split('@')[0],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }

    return profileData;
  },

  /**
   * Automatically ensure a user profile contains all required model fields
   */
  async ensureUserProfileFields(uid: string, data: any, email: string, persist: boolean = true): Promise<any> {
    let finalReferralCode = data.referralCode;
    let finalInternalUserId = data.internalUserId;
    
    const nameFromEmail = email.split('@')[0];
    
    // If missing internal user ID, generate it now
    if (!finalInternalUserId) {
      const identity = await UserIdentityService.generateInternalIdentity(data.name || nameFromEmail);
      finalInternalUserId = identity.internalUserId;
      if (!finalReferralCode) {
        finalReferralCode = identity.referralCode;
      }
    }
    
    // Fallback if somehow still missing referral code
    if (!finalReferralCode) {
      finalReferralCode = `CHALO${uid.substring(uid.length - 5).toUpperCase()}`;
    }

    const defaultAvatar = data.avatarUrl || data.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Teddy';
    const resolvedRole = data.role || getDefaultRoleForEmail(email);

    const nameParts = (data.name || nameFromEmail).split(' ');

    const requiredFields = {
      id: uid,
      firebaseUid: uid,
      internalUserId: finalInternalUserId,
      firstName: data.firstName || nameParts[0] || '',
      lastName: data.lastName || nameParts.slice(1).join(' ') || '',
      name: data.name || nameFromEmail,
      email: data.email || email,
      phone: data.phone || '',
      dob: data.dob || '',
      gender: data.gender || 'Male',
      avatarUrl: defaultAvatar,
      photoURL: defaultAvatar,
      emailVerified: data.emailVerified ?? false,
      role: resolvedRole,
      referralCode: finalReferralCode,
      status: data.status || 'Active',
      createdBy: data.createdBy || 'system',
      savedAddresses: data.savedAddresses || []
    };

    let changed = false;
    const updates: any = {};

        for (const [key, val] of Object.entries(requiredFields)) {
      if (data[key] === undefined || data[key] === null || (key === 'email' && data[key] === '')) {
        updates[key] = val;
        changed = true;
      }
    }

    if (data.createdAt === undefined) {
      updates.createdAt = serverTimestamp();
      changed = true;
    }
    if (data.lastLogin === undefined) {
      updates.lastLogin = serverTimestamp();
      changed = true;
    }
    if (data.updatedAt === undefined) {
      updates.updatedAt = serverTimestamp();
      changed = true;
    }

    if (changed) {
      if (persist) {
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, updates, { merge: true });
        } catch(e) {
          console.warn("Failed to persist user profile fields", e);
        }
      }
      return { ...data, ...updates, ...requiredFields };
    }

    return { ...requiredFields, ...data };
  },

  /**
   * Securely update user profile details without modifying restricted fields
   */
  async updateProfileFields(uid: string, fields: Partial<UserProfile>): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    
    // Check if fields contain any forbidden keys
    const forbiddenKeys = ['id', 'firebaseUid', 'internalUserId', 'email', 'role', 'createdAt', 'updatedAt', 'emailVerified', 'referralCode', 'lastLogin'];
    const attemptedForbidden = Object.keys(fields).filter(key => forbiddenKeys.includes(key));
    if (attemptedForbidden.length > 0) {
      const errMsg = `Security rejection: Attempted to modify protected read-only fields: ${attemptedForbidden.join(', ')}`;
      console.warn(errMsg);
      throw new Error(errMsg);
    }

    // Filter out forbidden keys to absolutely prevent overwrite of id, email, role, referralCode, createdAt
    const safeFields: any = {};
    const editableKeys: (keyof UserProfile | 'firstName' | 'lastName')[] = ['name', 'firstName', 'lastName', 'phone', 'dob', 'gender', 'avatarUrl', 'photoURL', 'savedAddresses'];
    
    for (const key of editableKeys) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        safeFields[key] = fields[key];
        // Mirror photoURL/avatarUrl
        if (key === 'avatarUrl') safeFields['photoURL'] = fields[key];
        if (key === 'photoURL') safeFields['avatarUrl'] = fields[key];
      }
    }
    
    // Check if there are actually fields to update to prevent empty merges
    if (Object.keys(safeFields).length === 0) return;

    safeFields.updatedAt = serverTimestamp();
    
    await setDoc(userDocRef, safeFields, { merge: true });
  }
};
