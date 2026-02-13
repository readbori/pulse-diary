import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncAll } from '@/lib/sync';
import { migrateUserData } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        handleUserLogin(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (_event === 'SIGNED_IN' && session?.user) {
        await handleUserLogin(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLogin = async (authUser: User) => {
    // 로컬 → Google 연동: 데이터 마이그레이션
    const pendingMigration = localStorage.getItem('pulse_pending_migration');
    if (pendingMigration && pendingMigration !== authUser.id) {
      try {
        await migrateUserData(pendingMigration, authUser.id);
        console.log('[Auth] Data migrated:', pendingMigration, '→', authUser.id);
      } catch (err) {
        console.error('[Auth] Migration failed:', err);
      }
      localStorage.removeItem('pulse_pending_migration');
    }

    localStorage.setItem('pulse_user_id', authUser.id);
    localStorage.setItem('pulse_auth_type', 'google');

    try {
      // DB columns use snake_case: user_id, created_at, etc.
      const { data: existingProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      // PGRST116 = "no rows returned"
      if (!existingProfile && (error?.code === 'PGRST116' || !error)) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authUser.id,
            name: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
          });

        if (insertError) {
          console.error('[Auth] Error creating user profile:', insertError);
        }
      }
    } catch (error) {
      console.error('[Auth] Error in handleUserLogin:', error);
    }

    // Bidirectional sync: pull cloud → local, then push pending local → cloud
    syncAll(authUser.id).catch((err) => {
      console.warn('[Auth] Background sync failed:', err);
    });
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('pulse_user_id');
    localStorage.removeItem('pulse_auth_type');
    localStorage.removeItem('pulse_onboarded');
  };

  /** 로컬 유저가 Google 계정을 연동할 때 호출 */
  const linkGoogleAccount = async () => {
    const currentUserId = localStorage.getItem('pulse_user_id');
    if (currentUserId) {
      localStorage.setItem('pulse_pending_migration', currentUserId);
    }
    await signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, linkGoogleAccount }}>
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

