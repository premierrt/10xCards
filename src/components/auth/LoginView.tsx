import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { useAuth } from "../hooks/useAuth";

export function LoginView() {
  const [error, setError] = useState("");
  const { signIn, loading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      setError("");
      await signIn(email, password);

      // Redirect to dashboard on successful login
      // This will be handled by the auth state change in production
      window.location.href = "/dashboard";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas logowania";
      setError(errorMessage);
    }
  };

  return <LoginForm onSubmit={handleLogin} isLoading={loading} error={error} />;
}
