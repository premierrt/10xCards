import { useState } from "react";
import { RegisterForm } from "./RegisterForm";
import { SuccessMessage } from "./SuccessMessage";
import { useAuth } from "../hooks/useAuth";

type ViewState = "form" | "success";

export function RegisterView() {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [error, setError] = useState("");
  const { signUp, loading } = useAuth();

  const handleRegister = async (email: string, password: string) => {
    try {
      setError("");
      await signUp(email, password);
      
      // Show success message
      setViewState("success");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji";
      setError(errorMessage);
    }
  };

  if (viewState === "success") {
    return (
      <SuccessMessage
        title="Konto utworzone pomyślnie!"
        message="Twoje konto zostało utworzone. Możesz się teraz zalogować."
        actionText="Przejdź do logowania"
        actionHref="/login"
      />
    );
  }

  return (
    <RegisterForm
      onSubmit={handleRegister}
      isLoading={loading}
      error={error}
    />
  );
}