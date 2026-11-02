import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export type Wallet = { points: number; lifetimePoints: number; reportsCount: number };

const EMPTY: Wallet = { points: 0, lifetimePoints: 0, reportsCount: 0 };

/** Solde en temps réel. Le document users/{uid} n'est écrit QUE par les Cloud Functions. */
export function useWallet(uid: string | undefined) {
  const [wallet, setWallet] = useState<Wallet>(EMPTY);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const d = snap.data();
      setWallet(
        d
          ? { points: d.points ?? 0, lifetimePoints: d.lifetimePoints ?? 0, reportsCount: d.reportsCount ?? 0 }
          : EMPTY, // premier lancement : le doc est créé au premier signalement
      );
    });
  }, [uid]);

  return wallet;
}
