"use client";

import { useCallback } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";

export function usePermissions() {
  const { getAll: getProfile } = useCrud<{ role: string }>({
    endpoint: API_ROUTES.AUTH_PROFILE,
    queryKey: "profile",
    isAuthenticated: true,
  });

  const { getAll: getPermissions } = useCrud<string[]>({
    endpoint: `${API_ROUTES.PERMISSION}/me`,
    queryKey: "user-permissions",
    isAuthenticated: true,
  });

  const { data: profile } = getProfile();
  const { data: permissions } = getPermissions();

  const role = profile?.role ?? "";

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (role === "super_admin") return true;
      if (permissions && permissions.includes("__all__")) return true;
      if (permissions && permissions.includes(permission)) return true;
      return false;
    },
    [permissions, role]
  );

  return { role, permissions, hasPermission };
}
