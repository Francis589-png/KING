// src/firebase/provider.tsx
'use client';
import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  value: FirebaseContextValue;
}> = ({ children, value }) => {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export const useFirebaseApp = () => {
    const context = useFirebase();
    if (!context.app) {
        throw new Error('Firebase app not available');
    }
    return context.app;
}

export const useAuth = () => {
    const context = useFirebase();
    if (!context.auth) {
        throw new Error('Firebase Auth not available');
    }
    return context.auth;
}

export const useFirestore = () => {
    const context = useFirebase();
    if (!context.firestore) {
        throw new Error('Firestore not available');
    }
    return context.firestore;
}