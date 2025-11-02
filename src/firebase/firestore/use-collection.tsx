// src/firebase/firestore/use-collection.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);

  useEffect(() => {
    // If query is null, do nothing
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    // Check if query has changed
    if (
      queryRef.current &&
      JSON.stringify(queryRef.current) === JSON.stringify(query) && 
      data
    ) {
      setLoading(false);
      return;
    }
    
    queryRef.current = query;
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(documents);
        setLoading(false);
      },
      err => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, data]);

  return { data, loading, error };
}
