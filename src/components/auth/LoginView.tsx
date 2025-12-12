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
      // Redirect is handled in the signIn function
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas logowania";
      setError(errorMessage);
    }
  };

  return <LoginForm onSubmit={handleLogin} isLoading={loading} error={error} />;
}
