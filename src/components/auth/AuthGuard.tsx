import { useState, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface User {
  id: string;
  email: string;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This will be replaced with actual Supabase auth check
    const checkSession = async () => {
      try {
        // Placeholder for Supabase session check
        // const { data: { session } } = await supabase.auth.getSession();
        // setUser(session?.user || null);
        
        // For now, simulate loading
        setTimeout(() => {
          setUser(null); // Will be replaced with actual session data
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-gray-600">Sprawdzanie sesji...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login - this will be handled by middleware in production
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return <>{children}</>;
}