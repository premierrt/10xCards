import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  email: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    // This will be replaced with actual Supabase initialization
    const initializeAuth = async () => {
      try {
        // TODO: Replace with actual Supabase session check
        // const { data: { session } } = await supabase.auth.getSession();
        // setSession(session);
        // setUser(session?.user || null);

        // For now, simulate loading
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // TODO: Set up auth state change listener
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(
    //   (event, session) => {
    //     setSession(session);
    //     setUser(session?.user || null);
    //     setLoading(false);
    //   }
    // );

    // return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // TODO: Replace with actual Supabase signIn
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, throw error to show error handling
      throw new Error("Nieprawidłowy email lub hasło");
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);

      // TODO: Replace with actual Supabase signUp
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      // });

      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, simulate success
      console.log("Registration successful for:", email);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual Supabase signOut
      // const { error } = await supabase.auth.signOut();
      // if (error) throw error;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser(null);
      setSession(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
