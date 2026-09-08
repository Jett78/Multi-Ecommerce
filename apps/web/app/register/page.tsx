"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const router = useRouter();

  // Read directly from URL — bypasses useSearchParams() SSR/Suspense issues
  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const redirect = urlParams?.get("redirect") || localStorage.getItem("auth_redirect") || "/";

  const handleSuccess = (email: string, name: string) => {
    localStorage.setItem("auth_redirect", redirect);
    const params = new URLSearchParams();
    params.set("email", email);
    params.set("name", name);
    params.set("redirect", redirect);
    router.push(`/verify-email?${params.toString()}`);
  };

  const handleSwitchToLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign up to get started
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={handleSwitchToLogin}
            showSwitchLink={true}
          />
        </div>
      </div>
    </div>
  );
}
