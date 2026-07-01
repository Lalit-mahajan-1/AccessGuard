"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  user: any;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hydrateUser = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          if (res.data.token) localStorage.setItem('accessguard_token', res.data.token);
          localStorage.setItem('accessguard_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessguard_token');
          localStorage.removeItem('accessguard_user');
          setUser(null);
        } else {
          // If it's a network/server offline error, check local storage
          const token = localStorage.getItem('accessguard_token');
          const userData = localStorage.getItem('accessguard_user');
          if (token && userData) {
            setUser(JSON.parse(userData));
          }
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('accessguard_token', token);
    localStorage.setItem('accessguard_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('accessguard_token');
    localStorage.removeItem('accessguard_user');
    setUser(null);
    router.push('/login');
  };

  // Centralized Route Protection & Automatic Login Redirection
  useEffect(() => {
    if (!isAuthLoading) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
      const isPublicPath = publicPaths.some(path => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
      });

      if (user && isPublicPath) {
        router.push('/dashboard');
      } else if (!user && !isPublicPath) {
        router.push('/login');
      }
    }
  }, [user, isAuthLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAuthLoading }}>
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
