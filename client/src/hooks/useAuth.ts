// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessguard_token');
    const userData = localStorage.getItem('accessguard_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('accessguard_token', token);
    localStorage.setItem('accessguard_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard'); // or wherever your main app is
  };

  const logout = () => {
    localStorage.removeItem('accessguard_token');
    localStorage.removeItem('accessguard_user');
    setUser(null);
    router.push('/login');
  };

  return { user, login, logout, isAuthenticated: !!user };
};