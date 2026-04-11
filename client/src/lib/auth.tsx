import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    // Escuchar cambios en localStorage (ej: créditos)
    const handleStorageChange = () => {
      const updated = localStorage.getItem('user');
      if (updated) {
        try { setUser(JSON.parse(updated)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cargar usuario desde localStorage al inicio
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, name: string) => {
    try {
      console.log('🔐 Starting login process...');

      // Llamar al backend de PostgreSQL
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        throw new Error('Error en la autenticación');
      }

      const userData = await res.json();
      console.log('✅ Login successful, user:', userData);

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ Login complete, user set in state and localStorage');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
      console.log('✅ Logout successful');
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