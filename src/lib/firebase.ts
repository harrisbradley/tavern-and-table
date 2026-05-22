import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is fully configured by testing for the Project ID
const isFirebaseConfigured = 
  typeof window !== "undefined" && 
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "placeholder";

let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("Firebase initialized successfully in sync mode.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.log("Firebase config not found or incomplete. Operating in local BroadcastChannel fallback sync mode.");
}

export { db, isFirebaseConfigured };
export default db;
