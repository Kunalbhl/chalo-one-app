import { db } from '../firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { ErrorService } from './errorService';

export interface FeatureFlags {
  rides: boolean;
  food: boolean;
  mart: boolean;
  hotels: boolean;
  bills: boolean;
  wallet: boolean;
  referral: boolean;
  payments: boolean;
  notifications: boolean;
  maps: boolean;
  ai: boolean;
  affiliate: boolean;
}

export interface RemoteConfig {
  maintenanceMode: boolean;
  minimumVersion: string;
  forceUpdate: boolean;
  bookingCommission: number;
  walletBonus: number;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  country: string;
}

const defaultFeatures: FeatureFlags = {
  rides: true, food: true, mart: true, hotels: true, bills: true,
  wallet: true, referral: true, payments: true, notifications: true,
  maps: true, ai: true, affiliate: true
};

const defaultConfig: RemoteConfig = {
  maintenanceMode: false,
  minimumVersion: '1.0.0',
  forceUpdate: false,
  bookingCommission: 5,
  walletBonus: 50,
  supportEmail: 'support@chaloone.com',
  supportPhone: '+91-800-CHALO',
  currency: 'INR',
  country: 'IN'
};

export const ConfigService = {
  async getFeatures(): Promise<FeatureFlags> {
    try {
      if (!db) return defaultFeatures;
      const docRef = doc(db, 'system', 'features');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...defaultFeatures, ...snap.data() } as FeatureFlags;
      }
      return defaultFeatures;
    } catch (error) {
      ErrorService.logError(error, 'ConfigService.getFeatures');
      return defaultFeatures;
    }
  },

  async getConfig(): Promise<RemoteConfig> {
    try {
      if (!db) return defaultConfig;
      const docRef = doc(db, 'system', 'config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...defaultConfig, ...snap.data() } as RemoteConfig;
      }
      return defaultConfig;
    } catch (error) {
      ErrorService.logError(error, 'ConfigService.getConfig');
      return defaultConfig;
    }
  },

  
  async updateFeatures(newFeatures: Partial<FeatureFlags>): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'system', 'features');
      await setDoc(docRef, newFeatures, { merge: true });
    } catch (error) {
      ErrorService.logError(error, 'ConfigService.updateFeatures');
      throw error;
    }
  },

  subscribeToFeatures(callback: (features: FeatureFlags) => void): () => void {
    if (!db) return () => {};
    return onSnapshot(doc(db, 'system', 'features'), (doc) => {
      if (doc.exists()) {
        callback({ ...defaultFeatures, ...doc.data() } as FeatureFlags);
      }
    }, (error) => {
      ErrorService.logError(error, 'ConfigService.subscribeToFeatures');
    });
  }
};
