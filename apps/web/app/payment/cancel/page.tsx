"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";

type Status = "cancelling" | "cancelled" | "error";

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const pidx = searchParams.get("pidx");
  const [status, setStatus] = useState<Status>(pidx ? "cancelling" : "error");

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    async function cancelOrder() {
      if (!pidx) {
        setStatus("error");
        return;
      }

      try {
        const orderResult = await apiClient<any>(
          `${API_ROUTES.KHALTI_ORDER}?pidx=${encodeURIComponent(pidx)}`,
        );
        const order = orderResult?.data;

        if (order?.orderId) {
          await fetch(`${API_ROUTES.ORDERS}/${order.orderId}/cancel`, {
            method: "POST",
            credentials: "include",
          });
        }

        setStatus("cancelled");
      } catch (err) {
        console.error("Failed to cancel order:", err);
        setStatus("cancelled");
      }
    }

    cancelOrder();
  }, [pidx]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-10 text-center">
          {status === "cancelling" && (
            <>
              <Loader2 className="h-16 w-16 text-orange-500 mx-auto animate-spin mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">Cancelling Order…</h1>
              <p className="text-slate-500">Please wait while we cancel your order.</p>
            </>
          )}

          {status === "cancelled" && (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
              <p className="text-slate-500 mb-6">
                Your order has been cancelled. No charges have been made. Stock has been restored.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
              <p className="text-slate-500 mb-6">
                You have cancelled the payment. No charges have been made.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
