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
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Usamos diretamente o arquivo de configuração gerado pelo sistema.
// Isso garante que o app funcione no Vercel sem precisar configurar variáveis de ambiente manualmente.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

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
  deleteDoc
};
