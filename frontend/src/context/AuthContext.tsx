import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { DatabaseService } from '../services/database';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('kfa_session_token');
      const savedUserStr = await AsyncStorage.getItem('@kfa_auth_user');
      const savedProfileStr = await AsyncStorage.getItem('@kfa_auth_profile');

      if (token && savedUserStr && savedProfileStr) {
        const parsedUser = JSON.parse(savedUserStr);
        const parsedProfile = JSON.parse(savedProfileStr);
        setUser(parsedUser);
        setProfile(parsedProfile);
        setIsLoading(false);
        return;
      }

      if (token) {
        // Verify session with backend API
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const prof = (await DatabaseService.getProfile(data.user.id)) || {
              id: data.user.id,
              full_name: data.user.full_name || 'Authenticated User',
              email: data.user.email,
              role: data.user.role as UserRole,
              status: 'ACTIVE',
            };
            setProfile(prof);
            await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(data.user));
            await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
            setIsLoading(false);
            return;
          }
        }
      }

      // Supabase session fallback
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const prof = await DatabaseService.getProfile(session.user.id);
          if (prof && prof.status === 'ACTIVE') {
            setProfile(prof);
            await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(session.user));
            await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          }
        }
      }
    } catch (e) {
      console.error('Session restoration error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try Backend Authentication API
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.token && data.user) {
          await AsyncStorage.setItem('kfa_session_token', data.token);
          setUser(data.user);
          const prof = (await DatabaseService.getProfile(data.user.id)) || {
            id: data.user.id,
            full_name: data.user.full_name || cleanEmail,
            email: cleanEmail,
            role: data.user.role as UserRole,
            status: 'ACTIVE',
          };
          setProfile(prof);
          await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(data.user));
          await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
          setIsLoading(false);
          return { success: true };
        }
      }

      // 2. Supabase Authentication Fallback
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const prof = await DatabaseService.getProfile(data.user.id);
          if (!prof || prof.status !== 'ACTIVE') {
            await supabase.auth.signOut();
            setIsLoading(false);
            return { success: false, error: 'Account is inactive. Contact Admin.' };
          }
          setUser(data.user);
          setProfile(prof);
          await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(data.user));
          await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
          setIsLoading(false);
          return { success: true };
        }
      }

      // 3. Standalone Credentials Fallback
      if (cleanEmail === 'admin@kfa.edu' && pass === 'AdminPass123!') {
        const prof = (await DatabaseService.getProfile('u-admin-001')) || {
          id: 'u-admin-001',
          full_name: 'Dr. Ramesh Kumar (Admin)',
          email: 'admin@kfa.edu',
          role: 'ADMIN',
          status: 'ACTIVE',
        };
        const uObj = { id: 'u-admin-001', email: cleanEmail, role: 'ADMIN' };
        await AsyncStorage.setItem('kfa_session_token', 'demo-session-token');
        await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(uObj));
        await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
        setUser(uObj);
        setProfile(prof);
        setIsLoading(false);
        return { success: true };
      }

      if (cleanEmail === 'staff.priya@kfa.edu' && pass === 'StaffPass123!') {
        const prof = (await DatabaseService.getProfile('u-staff-001')) || {
          id: 'u-staff-001',
          full_name: 'Mrs. Priya Sharma (Staff)',
          email: 'staff.priya@kfa.edu',
          role: 'STAFF',
          status: 'ACTIVE',
        };
        const uObj = { id: 'u-staff-001', email: cleanEmail, role: 'STAFF' };
        await AsyncStorage.setItem('kfa_session_token', 'demo-session-token');
        await AsyncStorage.setItem('@kfa_auth_user', JSON.stringify(uObj));
        await AsyncStorage.setItem('@kfa_auth_profile', JSON.stringify(prof));
        setUser(uObj);
        setProfile(prof);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid email or password.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem('kfa_session_token');
    if (token) {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    await AsyncStorage.removeItem('kfa_session_token');
    await AsyncStorage.removeItem('@kfa_auth_user');
    await AsyncStorage.removeItem('@kfa_auth_profile');

    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile ? profile.role : null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
