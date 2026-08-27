"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Truck, Loader2, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { usePermissions } from "@/hooks/use-permissions";
import { showSuccess, showError } from "@/lib/toast-helper";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "./order-detail-ui";
import type { OrderStatus, PaymentStatus } from "@/types/order";

interface OrderActionsProps {
  orderId: string;
  initialStatus: OrderStatus;
  initialPaymentStatus: PaymentStatus;
  courierProvider?: string | null;
  courierConsignmentId?: string | null;
  courierTrackingUrl?: string | null;
  district?: string | null;
}

export default function OrderActions({
  orderId,
  initialStatus,
  initialPaymentStatus,
  courierProvider,
  courierConsignmentId,
  courierTrackingUrl,
  district,
}: OrderActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("order.manage");
  const canUpdate = hasPermission("order.update");

  const [status, setStatus] = React.useState<OrderStatus>(initialStatus);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(initialPaymentStatus);

  React.useEffect(() => {
    setStatus(initialStatus);
    setPaymentStatus(initialPaymentStatus);
  }, [initialStatus, initialPaymentStatus]);

  const updateStatusMutation = useMutation({
    mutationFn: async (nextStatus: OrderStatus) => {
      return apiClient(`${API_ROUTES.ORDERS}/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
        isAuthenticated: true,
      });
    },
    onSuccess: () => {
      showSuccess("Order status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      router.refresh();
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to update order status");
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (nextStatus: PaymentStatus) => {
      return apiClient(`${API_ROUTES.ORDERS}/${orderId}/payment-status`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus: nextStatus }),
        isAuthenticated: true,
      });
    },
    onSuccess: () => {
      showSuccess("Payment status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      router.refresh();
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to update payment status");
    },
  });

  const sendToCourierMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`${API_ROUTES.ORDERS}/${orderId}/send-to-courier`, {
        method: "POST",
        isAuthenticated: true,
      });
    },
    onSuccess: (res: any) => {
      const consignmentId = res?.data?.consignmentId;
      showSuccess(
        res?.data?.alreadySent
          ? `Order already sent (Consignment: ${consignmentId})`
          : `Order sent to courier. Consignment: ${consignmentId}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      router.refresh();
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to send order to courier");
    },
  });

  const syncCourierMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`${API_ROUTES.ORDERS}/${orderId}/sync-courier`, {
        method: "POST",
        isAuthenticated: true,
      });
    },
    onSuccess: () => {
      showSuccess("Order status synced from courier");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      router.refresh();
    },
    onError: (err: { message?: string }) => {
      showError(err.message || "Failed to sync order status from courier");
    },
  });

  if (!canManage) return null;

  const canSendToCourier =
    canUpdate &&
    courierProvider &&
    !courierConsignmentId;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-700">
        <Truck className="size-4" />
        <span className="text-sm font-semibold">Manage Order</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {courierConsignmentId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            Consignment: {courierConsignmentId}
          </span>
        ) : courierProvider ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Courier: {courierProvider}
          </span>
        ) : null}

        {courierTrackingUrl ? (
          <a
            href={courierTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-200"
          >
            Track shipment
          </a>
        ) : null}

        {canSendToCourier && (
          <button
            type="button"
            disabled={sendToCourierMutation.isPending}
            onClick={() => sendToCourierMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primarymain px-4 py-2 text-sm font-semibold text-white hover:bg-primarymain/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendToCourierMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Truck className="size-4" />
            )}
            Send to Courier
          </button>
        )}

        {canUpdate && courierConsignmentId && (
          <button
            type="button"
            disabled={syncCourierMutation.isPending}
            onClick={() => syncCourierMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primarymain px-4 py-2 text-sm font-semibold text-primarymain hover:bg-primarymain/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncCourierMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Sync status
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Delivery Status</label>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
            >
              {ORDER_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
                <button
                  type="button"
                  disabled={updateStatusMutation.isPending || status === initialStatus}
                  onClick={() => updateStatusMutation.mutate(status)}
                  className="rounded-lg bg-primarymain px-4 py-2 text-sm font-semibold text-white hover:bg-primarymain/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Payment Status</label>
          <div className="flex gap-2">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
            >
              {PAYMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
                <button
                  type="button"
                  disabled={updatePaymentMutation.isPending || paymentStatus === initialPaymentStatus}
                  onClick={() => updatePaymentMutation.mutate(paymentStatus)}
                  className="rounded-lg bg-primarymain px-4 py-2 text-sm font-semibold text-white hover:bg-primarymain/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
              {updatePaymentMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Update"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
