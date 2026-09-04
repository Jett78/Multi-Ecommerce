"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "@/lib/auth-client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await signIn.email({ email, password });

      if (error) {
        setError(error.message || "Login failed");
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/profile`,
          { credentials: "include" }
        );
        const data = await response.json();
        const role = data?.data?.role || "user";
        const emailVerified = data?.data?.emailVerified;

        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;

        if (role === "admin" || role === "super_admin" || role === "editor" || role === "manager") {
          if (!emailVerified) {
            await signOut();
            router.push(
              `/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(data?.data?.name || "")}`
            );
          } else {
            router.push("/dashboard");
          }
        } else if (!emailVerified) {
          await signOut();
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(data?.data?.name || "")}`
          );
        } else {
          router.push("/profile/user");
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/callback`,
      });
      if (error) {
        setError(error.message || "Google sign-in failed");
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
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

        <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 bg-white p-6">
          {error && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-gray-900 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full border border-gray-200 bg-white pl-9 pr-10 py-2.5 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-gray-900 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
