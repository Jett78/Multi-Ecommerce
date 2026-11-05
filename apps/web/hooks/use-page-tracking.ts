"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  
  if (typeof window !== "undefined") {
    sessionId = sessionStorage.getItem("analytics_session");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("analytics_session", sessionId);
    }
  }
  
  return sessionId || "";
}

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await apiClient(API_ROUTES.PAGE_VIEWS_TRACK, {
          method: "POST",
          body: JSON.stringify({
            pagePath: pathname,
            pageTitle: document.title,
            referrer: document.referrer,
            sessionId: getSessionId(),
          }),
        });
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    trackPageView();
  }, [pathname]);
}
