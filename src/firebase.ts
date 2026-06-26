import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "project-04bfa200-a957-4b5f-a54",
  appId: "1:249278901100:web:c2cc64162cb7923ca56149",
  apiKey: "AIzaSyCycCOkBHlCiXCvcxtO-sAuj-DmCXVmCqQ",
  authDomain: "project-04bfa200-a957-4b5f-a54.firebaseapp.com",
  storageBucket: "project-04bfa200-a957-4b5f-a54.firebasestorage.app",
  messagingSenderId: "249278901100",
};

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
    }, "ai-studio-ac1b9c42-82f4-453a-8482-f67e9cad0e46");
  } catch (e) {
    console.warn("Error initializing Firestore:", e);
  }
}

export const FIREBASE_DATABASE_SECRET = "FL2BSNMpV0ZAZl8nez9qX7QZX4He1EorXaVI1Fmf";
export { auth, db };
