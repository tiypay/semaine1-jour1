import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

/**
 * MVP : connexion anonyme = zéro friction à l'onboarding.
 * L'utilisateur "upgradera" son compte (téléphone / Google / Apple via linkWithCredential)
 * au moment du premier retrait : c'est là qu'on a besoin d'une identité vérifiée (anti-fraude + KYC).
 */
export function useAnonymousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setInitializing(false);
        return;
      }
      try {
        await signInAnonymously(auth); // déclenche à nouveau onAuthStateChanged avec l'utilisateur
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connexion impossible');
        setInitializing(false);
      }
    });
  }, []);

  return { user, initializing, error };
}
