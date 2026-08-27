"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { verifyKhaltiPayment } from "@/actions/khalti-action";
import type { Order, OrderResponse } from "@/types/khalti";
import { CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

type Status = "verifying" | "success" | "failed" | "error";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pidx = searchParams.get("pidx");

  const [status, setStatus] = useState<Status>("verifying");
  const [orderId, setOrderId] = useState<string | null>(null);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    async function run() {
      if (!pidx) {
        setStatus("error");
        return;
      }

      setStatus("verifying");
      try {
        const result = await verifyKhaltiPayment(pidx);
        const data = result?.data;

        if (data && data.status === "Completed") {
          setStatus("success");

          let resolvedId: string | null = null;
          try {
            const orderResult = await apiClient<OrderResponse>(
              `${API_ROUTES.KHALTI_ORDER}?pidx=${encodeURIComponent(pidx)}`,
            );
            const order: Order | null = orderResult?.data ?? null;
            resolvedId = order?.id ?? null;
          } catch {
            resolvedId = null;
          }

          setOrderId(resolvedId);

          setTimeout(() => {
            if (resolvedId) {
              router.push(`/profile/user/orders/${resolvedId}`);
            } else {
              router.push("/profile/user/orders");
            }
          }, 2000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    run();
  }, [pidx, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {status === "verifying" && (
          <div className="p-10 text-center">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying Payment…</h1>
            <p className="text-slate-500">Please wait while we confirm your payment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 mb-2">
              Your payment has been processed successfully.
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Redirecting to your order in 2 seconds…
            </p>

            {orderId ? (
              <Link
                href={`/profile/user/orders/${orderId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                View Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/profile/user/orders"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                View Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {status === "failed" && (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 mb-6">
              Something went wrong with your payment. Please try again.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Payment Response</h1>
            <p className="text-slate-500 mb-6">
              We couldn't find a valid payment reference for this request.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
