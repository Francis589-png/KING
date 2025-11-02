// src/firebase/firestore/use-doc.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import {
  onSnapshot,
  doc,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refRef = useRef(ref);

  useEffect(() => {
    if (!ref) {
        setData(null);
        setLoading(false);
        return;
    }

    if (refRef.current && refRef.current.path === ref.path && data) {
        setLoading(false);
        return;
    }

    refRef.current = ref;
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      err => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref, data]);

  return { data, loading, error };
}
