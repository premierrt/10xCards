import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function LogoutButton({ variant = "outline", size = "sm" }: LogoutButtonProps) {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <Button 
      onClick={handleLogout}
      disabled={loading}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      {loading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}