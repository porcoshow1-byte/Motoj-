import React, { createContext, useContext, useEffect, useState } from 'react';
import { observeAuthState } from '../services/auth';
// Import type from firebase/auth is safe as it's just a type definition, not runtime code
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | any | null; // Allow mock user type
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);