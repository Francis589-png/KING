// src/firebase/client-provider.tsx
'use client';
import React, { useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseContextValue = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider value={firebaseContextValue}>
      {children}
    </FirebaseProvider>
  );
}