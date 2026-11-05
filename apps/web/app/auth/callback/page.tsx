"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "@/config/api-routes";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      try {
        const response = await fetch(API_ROUTES.AUTH_PROFILE, { credentials: "include" });
        const data = await response.json();
        const role = data?.data?.role || "user";

        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;

        if (role === "admin" || role === "super_admin") {
          router.push("/dashboard");
        } else {
          router.push("/profile/user");
        }
      } catch {
        router.push("/login");
      }
    };

    fetchRoleAndRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
