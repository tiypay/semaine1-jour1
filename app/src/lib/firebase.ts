import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// NB : les types publics de firebase/auth n'exposent pas getReactNativePersistence (Metro charge bien
// le build React Native à l'exécution). Le mapping `paths` de tsconfig.json corrige le typage.
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

/**
 * Renseigner ces variables dans `app/.env` (voir `.env.example`).
 * Les variables préfixées EXPO_PUBLIC_ sont injectées au build par Expo.
 * Ce ne sont pas des secrets : la sécurité repose sur les Security Rules + App Check.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isFirstInit = getApps().length === 0;
export const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// La session (même anonyme) survit aux redémarrages de l'app grâce à AsyncStorage.
// initializeAuth ne doit être appelé qu'une fois (le Fast Refresh ré-exécute ce module).
export const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
// Même région que les Cloud Functions (functions/src/index.ts).
export const functions = getFunctions(app, 'europe-west1');
