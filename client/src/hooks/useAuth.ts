// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hydrateUser = async () => {
      try {
        // 1. Try to fetch from backend (This uses HttpOnly cookies from OAuth!)
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          // Sync localStorage for backward compatibility with existing code
          if (res.data.token) localStorage.setItem('accessguard_token', res.data.token);
          localStorage.setItem('accessguard_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
          return;
        }
      } catch (error) {
        // If it fails (e.g. 401), fallback to localStorage to see if local token exists
        const token = localStorage.getItem('accessguard_token');
        const userData = localStorage.getItem('accessguard_user');
        if (token && userData) {
          setUser(JSON.parse(userData));
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
    // Optionally ping backend to clear cookie: await api.post('/auth/logout');
    setUser(null);
    router.push('/login');
  };

  return { user, login, logout, isAuthenticated: !!user, isAuthLoading };
};