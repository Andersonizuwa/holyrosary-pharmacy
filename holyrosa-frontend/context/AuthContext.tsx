'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';
import { TOKEN_KEY, USER_KEY } from '@/utils/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 AuthProvider: useEffect started');
    
    // Skip server-side rendering
    if (typeof window === 'undefined') {
      console.log('🔍 AuthProvider: Server-side, skipping init');
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      console.log('🔍 AuthProvider: initAuth started');
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        
        console.log('🔍 AuthProvider: token exists?', !!token, 'user exists?', !!savedUser);

        if (token && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            console.log('✅ AuthProvider: User restored from localStorage:', parsedUser.email);
          } catch (parseError) {
            console.error('❌ AuthProvider: Failed to parse user:', parseError);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        } else {
          console.log('✅ AuthProvider: No stored auth, user is not authenticated');
        }
      } catch (error: any) {
        console.error('❌ AuthProvider: Initialization error:', error.message);
      } finally {
        console.log('🔍 AuthProvider: Setting loading to false');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);

      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      console.log('Login successful, received token and user:', { token: token.substring(0, 10) + '...', user: user.email });

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setUser(user);

      console.log('Redirecting to dashboard...');
      // Use window.location for immediate redirect in App Router
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    // Use window.location for immediate redirect in App Router
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role || null,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
