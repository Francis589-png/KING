// src/firebase/index.ts
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import {
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  FirebaseProvider,
} from './provider';
import { FirebaseClientProvider } from './client-provider';


function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

// Dummy exports for hooks that might be created later
const useCollection = (query: any) => ({ data: [], loading: true, error: null });
const useDoc = (query: any) => ({ data: null, loading: true, error: null });
const useUser = () => ({ user: null, loading: true });


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useCollection,
  useDoc,
  useUser,
};