"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { LoginForm } from "./login-form";

export function LoginModal() {
  const router = useRouter();
  const { loginOpen, redirectTo, closeAll, openRegister } = useAuthModal();

  const handleSuccess = () => {
    closeAll();
    router.push(redirectTo);
  };

  const handleSwitchToRegister = () => {
    openRegister(redirectTo);
  };

  if (!loginOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={closeAll}
    >
      <div
        className="w-full max-w-md border border-gray-200 bg-white p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center bg-gray-100 mb-3">
            <Lock className="h-4 w-4 text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-400">Sign in to your account</p>
        </div>

        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={handleSwitchToRegister}
          showSwitchLink={true}
        />

        <button
          type="button"
          onClick={closeAll}
          className="mt-4 w-full text-center text-sm text-gray-300 hover:text-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
