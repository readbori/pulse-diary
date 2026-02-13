import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncAll } from '@/lib/sync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
    localStorage.setItem('pulse_user_id', authUser.id);

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
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
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

