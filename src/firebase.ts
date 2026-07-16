import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
let app: any = null;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  if (app) {
    console.log("✓ Firebase Initialized");
  }
} catch (e: any) {
  console.warn("Could not initialize Firebase App:", e.message || e);
}

// Initialize Auth
let auth: any = null;
if (app) {
  try {

    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
    console.log("✓ Auth Initialized");
  } catch (e: any) {
    console.warn("Error initializing Firebase Auth:", e.message || e);
    try {
      
      auth = initializeAuth(app, {
        persistence: inMemoryPersistence
      });
      console.log("✓ Auth Initialized (In-Memory Fallback)");
    } catch(err2) {
      console.error("Critical Auth Initialization Failure", err2);
    }
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
    console.log("✓ Firestore Initialized");
    
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db).catch((err: any) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore offline persistence failed (multiple tabs open)");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore offline persistence unimplemented by browser");
        } else {
          console.error("Firestore offline persistence error:", err);
        }
      });
    }
  } catch (e: any) {
    console.warn("Error initializing Firestore:", e.message || e);
  }
}

// Initialize Storage
let storage: any = null;
if (app) {
  try {
    storage = getStorage(app);
    console.log("✓ Storage Initialized");
  } catch (e: any) {
    console.warn("Error initializing Firebase Storage:", e.message || e);
  }
}

// Initialize Firebase App Check
let appCheck: any = null;
if (app && typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("✓ App Check Initialized");

      getToken(appCheck)
        .then(() => {
          console.log("✓ App Check Token Received");
        })
        .catch((error: any) => {
          console.warn("Firebase App Check Token error:", error.message || error);
        });
    } catch (e: any) {
      console.warn("Error initializing Firebase App Check:", e.message || e);
    }
  } else {
    console.warn("⚠️ Firebase App Check skipped gracefully: VITE_RECAPTCHA_SITE_KEY environment variable is missing.");
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

export { auth, db, storage, appCheck, app };

