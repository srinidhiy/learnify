import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  hasOnboarded: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        console.log('Session check timed out');
        setIsLoading(false);
        setIsAuthenticated(false);
      }, 5000);
    
    const checkSession = async () => {
      try {
        const { error: pingError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
        if (pingError) throw pingError

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error('No authenticated user');
          }
    
        setIsAuthenticated(true);
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_onboarded')
            .eq('id', user.id)
            .single();
          
          setHasOnboarded(!!profile?.has_onboarded);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsAuthenticated(false);
        setHasOnboarded(false);
      } finally {
        console.log(user)
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('has_onboarded')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setHasOnboarded(!!profile?.has_onboarded);
          });
      }
    });

    return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasOnboarded, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);