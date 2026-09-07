"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { RegisterForm } from "./register-form";

export function RegisterModal() {
  const router = useRouter();
  const { registerOpen, redirectTo, closeAll, openLogin } = useAuthModal();

  const handleSuccess = (email: string, name: string) => {
    closeAll();
    const params = new URLSearchParams();
    params.set("email", email);
    params.set("name", name);
    params.set("redirect", redirectTo);
    router.push(`/verify-email?${params.toString()}`);
  };

  const handleSwitchToLogin = () => {
    openLogin(redirectTo);
  };

  if (!registerOpen) return null;

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
            <UserPlus className="h-4 w-4 text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm text-gray-400">Sign up to get started</p>
        </div>

        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={handleSwitchToLogin}
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
