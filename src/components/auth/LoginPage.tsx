import { AuthProvider } from "../hooks/useAuth";
import { LoginView } from "./LoginView";

export function LoginPage() {
  return (
    <AuthProvider>
      <LoginView />
    </AuthProvider>
  );
}