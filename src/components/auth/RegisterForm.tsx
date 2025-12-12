import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, Shield } from "lucide-react";

interface RegisterFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email jest wymagany";
    }
    if (!emailRegex.test(email)) {
      return "Nieprawidłowy format email";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "Hasło jest wymagane";
    }
    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }
    if (!/\d/.test(password)) {
      return "Hasło musi zawierać co najmniej jedną cyfrę";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      return "Potwierdzenie hasła jest wymagane";
    }
    if (confirmPassword !== password) {
      return "Hasła nie są identyczne";
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
    if (confirmPassword && confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordError || password) {
      setConfirmPasswordError(validateConfirmPassword(value, password));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    const confirmPasswordValidationError = validateConfirmPassword(confirmPassword, password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    setConfirmPasswordError(confirmPasswordValidationError);

    if (emailValidationError || passwordValidationError || confirmPasswordValidationError) {
      return;
    }

    if (onSubmit) {
      await onSubmit(email, password);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Rejestracja</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              <Mail size={16} />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="twoj@email.com"
              disabled={isLoading}
              aria-invalid={!!emailError}
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              <Lock size={16} />
              Hasło
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Co najmniej 8 znaków i 1 cyfra"
              disabled={isLoading}
              aria-invalid={!!passwordError}
              className={passwordError ? "border-red-500" : ""}
            />
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <div className="text-xs text-gray-500">
              Hasło musi zawierać co najmniej 8 znaków i jedną cyfrę
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              <Shield size={16} />
              Potwierdź hasło
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Powtórz hasło"
              disabled={isLoading}
              aria-invalid={!!confirmPasswordError}
              className={confirmPasswordError ? "border-red-500" : ""}
            />
            {confirmPasswordError && (
              <p className="text-sm text-red-600">{confirmPasswordError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Rejestrowanie...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{" "}
            <a 
              href="/login" 
              className="text-primary hover:underline font-medium"
            >
              Zaloguj się
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}