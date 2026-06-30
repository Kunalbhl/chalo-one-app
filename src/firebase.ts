import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '/firebase-applet-config.json';

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

export const FIREBASE_DATABASE_SECRET = "FL2BSNMpV0ZAZl8nez9qX7QZX4He1EorXaVI1Fmf";
export { auth, db };
