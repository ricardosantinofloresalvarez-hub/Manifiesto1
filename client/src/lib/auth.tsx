import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch user data from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Error fetching user from Firestore:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, name: string) => {
    try {
      // Sign in anonymously with Firebase
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Create or update user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userData = {
        email,
        name,
      };

      await setDoc(userDocRef, userData, { merge: true });

      const user: User = {
        id: firebaseUser.uid,
        email,
        name,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
