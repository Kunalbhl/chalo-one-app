import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Could not initialize Firebase App:", e);
}

// Initialize Auth
let auth: any = null;
if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch (e) {
    console.warn("Error initializing Firebase Auth:", e);
  }
}

// Initialize Firestore
let db: any = null;
if (app) {
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    } as any, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    console.warn("Error initializing Firestore:", e);
  }
}

// Initialize Storage
let storage: any = null;
if (app) {
  try {
    storage = getStorage(app);
  } catch (e) {
    console.warn("Error initializing Firebase Storage:", e);
  }
}

// Initialize Firebase App Check
let appCheck: any = null;
if (app && typeof window !== 'undefined') {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LeW_90pAAAAAA-dummy-key-for-appcheck-debug'),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("Error initializing Firebase App Check:", e);
  }
}

export async function getAppCheckToken() {
  if (!appCheck) {
    return { token: '' };
  }
  try {
    const tokenResult = await getToken(appCheck);
    return {
      token: tokenResult.token,
    };
  } catch (e) {
    console.warn("Error getting App Check token:", e);
    return { token: '' };
  }
}

export { auth, db, storage, appCheck };

