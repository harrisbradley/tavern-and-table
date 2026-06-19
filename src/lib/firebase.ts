import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "placeholder";

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  if (typeof window !== "undefined") {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      auth = getAuth(app);
      console.log("Firebase initialized successfully on client in sync mode.");
    } catch (err) {
      console.error("Firebase client initialization failed:", err);
    }
  } else {
    console.log("Firebase config found. Server-side sync is ready (waiting for client hydration).");
  }
} else {
  const envName = typeof window !== "undefined" ? "client" : "server";
  console.log(`Firebase config not found or incomplete (${envName}). Operating in local BroadcastChannel fallback sync mode.`);
}

export { db, auth, isFirebaseConfigured };
export default db;
