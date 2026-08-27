import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { InitiatePaymentRequest, InitiatePaymentResponse, VerifyPaymentResponse } from "@/types/khalti";

// NOTE: These are intentionally plain client-side functions (no "use server").
// Khalti's `initiate` reads the user's session cookie and must run in the
// browser so credentials: "include" carries the logged-in session, and so the
// real API error (e.g. "Khalti payment is not configured") surfaces to the UI.

export async function initiateKhaltiPayment(data: InitiatePaymentRequest) {
  try {
    const response = await apiClient<InitiatePaymentResponse>(
      `${API_ROUTES.KHALTI}/initiate`,
      {
        method: "POST",
        body: JSON.stringify(data),
        isAuthenticated: true,
      }
    );
    return response;
  } catch (error: any) {
    console.error("Error initiating Khalti payment:", error);
    // Surface the real backend message (e.g. missing credentials) to the caller.
    const message =
      error?.message ||
      (typeof error === "string" ? error : "Failed to initiate Khalti payment");
    throw new Error(message);
  }
}

export async function verifyKhaltiPayment(pidx: string) {
  try {
    const response = await apiClient<VerifyPaymentResponse>(
      `${API_ROUTES.KHALTI}/verify`,
      {
        method: "POST",
        body: JSON.stringify({ pidx }),
      }
    );
    return response;
  } catch (error: any) {
    console.error("Error verifying Khalti payment:", error);
    throw error;
  }
}
