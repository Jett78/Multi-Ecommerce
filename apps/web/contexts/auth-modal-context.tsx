"use client";

import * as React from "react";

interface AuthModalContextType {
  loginOpen: boolean;
  registerOpen: boolean;
  redirectTo: string;
  openLogin: (redirectTo?: string) => void;
  openRegister: (redirectTo?: string) => void;
  closeAll: () => void;
}

const AuthModalContext = React.createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [redirectTo, setRedirectTo] = React.useState("/");

  const openLogin = React.useCallback((redirect?: string) => {
    if (redirect) setRedirectTo(redirect);
    setRegisterOpen(false);
    setLoginOpen(true);
  }, []);

  const openRegister = React.useCallback((redirect?: string) => {
    if (redirect) setRedirectTo(redirect);
    setLoginOpen(false);
    setRegisterOpen(true);
  }, []);

  const closeAll = React.useCallback(() => {
    setLoginOpen(false);
    setRegisterOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{ loginOpen, registerOpen, redirectTo, openLogin, openRegister, closeAll }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = React.useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
