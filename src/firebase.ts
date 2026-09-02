import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
  where,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isPlaceholder = (val?: string) => !val || val.includes('robotic-dialect') || val.includes('YOUR_project-id');

const config = {
  apiKey: !isPlaceholder(firebaseConfig.apiKey) ? firebaseConfig.apiKey : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: !isPlaceholder(firebaseConfig.authDomain) ? firebaseConfig.authDomain : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: !isPlaceholder(firebaseConfig.projectId) ? firebaseConfig.projectId : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: !isPlaceholder(firebaseConfig.storageBucket) ? firebaseConfig.storageBucket : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: !isPlaceholder(firebaseConfig.messagingSenderId) ? firebaseConfig.messagingSenderId : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: !isPlaceholder(firebaseConfig.appId) ? firebaseConfig.appId : import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)'
};

// Safeguard against common misconfigurations
if (!config.apiKey || config.apiKey.includes('robotic-dialect') || config.apiKey === config.projectId) {
  if (import.meta.env.DEV) {
    console.warn("Firebase API Key might be invalid. Check your configuration.");
  }
}

const app = initializeApp(config);
export const auth = getAuth(app);

// Use the databaseId if specified in the config, otherwise use (default)
const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
  ? config.firestoreDatabaseId 
  : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp,
  Timestamp,
  signInWithPopup,
  signOut,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
  where,
  limit
};
