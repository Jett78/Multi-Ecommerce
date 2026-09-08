"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { showSuccess } from "@/lib/toast-helper";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  // Read directly from URL — bypasses useSearchParams() SSR/Suspense issues
  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const verified = urlParams?.get("verified");
  const urlRedirect = urlParams?.get("redirect");

  useEffect(() => {
    if (verified === "true") {
      showSuccess("Email verified successfully! Please sign in.");
    }
  }, [verified]);

  const handleSuccess = () => {
    const storedRedirect = localStorage.getItem("auth_redirect");
    localStorage.removeItem("auth_redirect");
    router.push(urlRedirect || storedRedirect || "/");
  };

  const handleSwitchToRegister = () => {
    const storedRedirect = localStorage.getItem("auth_redirect");
    router.push(
      `/register?redirect=${encodeURIComponent(urlRedirect || storedRedirect || "/")}`
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>

        <div className="border border-gray-200 bg-white p-6">
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={handleSwitchToRegister}
            showSwitchLink={true}
          />
        </div>
      </div>
    </div>
  );
}
