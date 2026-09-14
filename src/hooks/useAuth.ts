import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Akun default admin lokal PLN Indonesia Power UBP Cilegon
export const DEFAULT_ADMIN = {
  email: 'admin@plnindonesiapower.co.id',
  password: 'Cilegon2026$',
  fallbackPasswords: ['Cilegon2026$'],
};

const LOCAL_STORAGE_AUTH_KEY = 'pln_admin_session';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek sesi lokal (Default Admin)
    const localAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (localAuth) {
      try {
        const parsed = JSON.parse(localAuth);
        if (parsed?.email) {
          const mockUser: User = {
            id: 'default-admin-id',
            app_metadata: {},
            user_metadata: { name: 'Admin PLN IP Cilegon' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: parsed.email,
          };
          setUser(mockUser);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing local auth:', e);
      }
    }

    // 2. Cek sesi dari Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Hanya timpa jika tidak login via default admin
      if (!localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Cek apakah menggunakan kredensial default admin
    const isDefaultEmail =
      cleanEmail === DEFAULT_ADMIN.email ||
      cleanEmail === 'admin' ||
      cleanEmail === 'admin@pln.co.id';
    const isDefaultPass = DEFAULT_ADMIN.fallbackPasswords.includes(cleanPass);

    if (isDefaultEmail && isDefaultPass) {
      const mockUser: User = {
        id: 'default-admin-id',
        app_metadata: {},
        user_metadata: { name: 'Admin PLN IP Cilegon' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: DEFAULT_ADMIN.email,
      };
      localStorage.setItem(
        LOCAL_STORAGE_AUTH_KEY,
        JSON.stringify({ email: DEFAULT_ADMIN.email, loggedInAt: new Date().toISOString() })
      );
      setUser(mockUser);
      return;
    }

    // Jika bukan akun default, gunakan Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Abaikan jika tidak login via supabase
    }
  }, []);

  return { session, user, loading, signIn, signOut };
}
