import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  collectionGroup,
  getDocs,
  getDocsFromCache,
  initializeFirestore,
  clearIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId ? getAnalytics(app) : null;

// Initialize Firebase App Check (Play Integrity on Native, ReCaptcha on Web)
// if (typeof window !== 'undefined') {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaEnterpriseProvider('YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY'),
//     isTokenAutoRefreshEnabled: true
//   });
// }

// Helper function to log critical telemetry
export const logTelemetryEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

// 🛡️ TACTICAL STABILITY FIX: Force Long Polling and Disable Persistence to bypass SDK crashes (b815/ca9)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: {
    kind: 'memory'
  }
});

// 🧹 PERSISTENCE RESET: Run this if b815/ca9 errors persist
export const resetKavachState = async () => {
  localStorage.removeItem('kavach_cache_timestamp');
  return new Promise(resolve => setTimeout(resolve, 1500)); 
};

// 🛡️ CAPACITOR AUTH FIX: Use IndexedDB persistence on native platforms
// Default browserLocalStorage fails in Capacitor WebView → user gets logged out on reload
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    })
  : getAuth(app);

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Utility
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
