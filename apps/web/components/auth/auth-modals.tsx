"use client";

import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";

export function AuthModals({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      {children}
      <LoginModal />
      <RegisterModal />
    </AuthModalProvider>
  );
}
