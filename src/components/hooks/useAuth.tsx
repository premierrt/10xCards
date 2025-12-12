import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { supabaseClient } from "../../db/supabase.client.ts";
import type { User, Session } from "@supabase/supabase-js";

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

  // Debug logging
  console.log("AuthProvider render - loading:", loading, "user:", user?.email);

  useEffect(() => {
    let mounted = true;

    // Safety timeout to ensure loading is set to false
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.log("Safety timeout: setting loading to false");
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth state...");

        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

        console.log("Environment check:", {
          supabaseUrl: supabaseUrl ? "present" : "missing",
          supabaseAnonKey: supabaseAnonKey ? "present" : "missing",
        });

        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn("Supabase not configured. Auth will be disabled.");
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }

        // Add timeout for the getSession call
        const sessionPromise = supabaseClient.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session timeout")), 5000));

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        if (mounted) {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
          clearTimeout(safetyTimeout);
          console.log("Auth initialized:", session?.user?.email || "no user");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (mounted) {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("signIn called, setting loading to true");
    setLoading(true);

    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.log("Supabase not configured");
        setLoading(false);
        throw new Error("System autentykacji nie jest skonfigurowany. Skontaktuj się z administratorem.");
      }

      console.log("Making login API request...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login API response:", response.status, data);

      if (!response.ok) {
        console.log("Login failed, setting loading to false");
        setLoading(false);
        throw new Error(data.error || "Błąd logowania");
      }

      console.log("Login successful, redirecting...");
      // After successful login, redirect to generate page
      window.location.href = "/generate";
    } catch (error) {
      console.log("Login error, setting loading to false", error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("signUp called, setting loading to true");
    setLoading(true);

    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.log("Supabase not configured");
        setLoading(false);
        throw new Error("System autentykacji nie jest skonfigurowany. Skontaktuj się z administratorem.");
      }

      console.log("Making register API request...");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Register API response:", response.status, data);

      if (!response.ok) {
        console.log("Registration failed, setting loading to false");
        setLoading(false);
        throw new Error(data.error || "Błąd rejestracji");
      }

      console.log("Registration successful, redirecting...");
      // After successful registration, redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.log("Registration error, setting loading to false", error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Logout API error");
      }

      // Clear local session regardless of API response
      await supabaseClient.auth.signOut();
      setUser(null);
      setSession(null);

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Still try to clear local state
      setUser(null);
      setSession(null);
      setLoading(false);
      window.location.href = "/login";
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
