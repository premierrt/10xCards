import { AuthProvider } from "../hooks/useAuth";
import { RegisterView } from "./RegisterView";

export function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterView />
    </AuthProvider>
  );
}