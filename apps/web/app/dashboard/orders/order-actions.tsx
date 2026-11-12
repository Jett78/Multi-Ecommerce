"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { usePermissions } from "@/hooks/use-permissions";
import { showSuccess, showError } from "@/lib/toast-helper";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  paymentMethodLabel,
  type StatusOption,
} from "./order-detail-ui";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

const GATEWAY_BLOCKED_TARGETS: string[] = ["completed", "pending"];

function optionLabel(options: StatusOption[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

function StatusControl({
  id,
  label,
  hint,
  options,
  value,
  fromLabel,
  toLabel,
  dirty,
  pending,
  disabled,
  restrictBadge,
  blockedReason,
  onChange,
  onSave,
}: {
  id: string;
  label: string;
  hint: string;
  options: StatusOption[];
  value: string;
  fromLabel: string;
  toLabel: string;
  dirty: boolean;
  pending: boolean;
  disabled: boolean;
  restrictBadge?: string;
  blockedReason?: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const saveDisabled = disabled || pending || !dirty || !!blockedReason;
  const canShowDirty = dirty && !blockedReason;

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors",
        canShowDirty ? "border-amber-300 bg-amber-50/70" : "border-slate-200 bg-slate-50/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <label
            htmlFor={id}
            className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500"
          >
            {label}
          </label>
          {restrictBadge && (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <Lock className="size-2.5 shrink-0" />
              <span className="truncate">{restrictBadge}</span>
            </span>
          )}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-wider",
            blockedReason
              ? "text-slate-500"
              : canShowDirty
                ? "text-amber-600"
                : "text-emerald-600"
          )}
        >
          {blockedReason ? (
            <Lock className="size-3" />
          ) : canShowDirty ? (
            <CircleAlert className="size-3" />
          ) : (
            <BadgeCheck className="size-3" />
          )}
          {blockedReason ? "Gateway" : canShowDirty ? "Unsaved" : "Up to date"}
        </span>
      </div>

      <div className="mt-2.5 flex gap-2">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition-colors focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={saveDisabled}
          onClick={onSave}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primarymain/40",
            canShowDirty
              ? "bg-primarymain text-white hover:bg-primarymain/90"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          )}
          title={
            blockedReason
              ? blockedReason
              : dirty
                ? `Save ${label.toLowerCase()}`
                : "No changes to save"
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Update"}
        </button>
      </div>

      <p
        className={cn(
          "mt-2 flex items-start gap-1.5 text-[11px] font-bold leading-relaxed",
          blockedReason
            ? "text-rose-500"
            : canShowDirty
              ? "text-amber-600"
              : "text-slate-400"
        )}
      >
        {blockedReason ? (
          <>
            <Lock className="mt-0.5 size-3 shrink-0" />
            <span>{blockedReason}</span>
          </>
        ) : canShowDirty ? (
          <>
            {fromLabel}
            <ArrowRight className="mt-0.5 size-3 shrink-0" />
            <span className="font-black">{toLabel}</span>
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

interface OrderActionsProps {
  orderId: string;
  initialStatus: OrderStatus;
  initialPaymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  courierProvider?: string | null;
  courierConsignmentId?: string | null;
  courierTrackingUrl?: string | null;
  district?: string | null;
}

export default function OrderActions({
  orderId,
  initialStatus,
  initialPaymentStatus,
  paymentMethod,
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
    onSuccess: async () => {
      showSuccess("Order status updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
        refetchType: "all",
      });
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
    onSuccess: async () => {
      showSuccess("Payment status updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
        refetchType: "all",
      });
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
    onSuccess: async (res: any) => {
      const consignmentId = res?.data?.consignmentId;
      showSuccess(
        res?.data?.alreadySent
          ? `Order already sent (Consignment: ${consignmentId})`
          : `Order sent to courier. Consignment: ${consignmentId}`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
        refetchType: "all",
      });
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
    onSuccess: async () => {
      showSuccess("Order status synced from courier");
      await queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
        refetchType: "all",
      });
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

  const readOnly = !canUpdate;

  const gatewayManaged = !!paymentMethod && paymentMethod !== "cod";
  const paidVia = paymentMethodLabel(paymentMethod);
  const paymentTargetBlocked =
    gatewayManaged && GATEWAY_BLOCKED_TARGETS.includes(paymentStatus);
  const paymentBlockedReason = paymentTargetBlocked
    ? `Cannot set "${optionLabel(PAYMENT_STATUS_OPTIONS, paymentStatus)}" manually - ${paidVia} verifies this payment`
    : null;
  const paymentHint = gatewayManaged
    ? `Auto-verified by ${paidVia} - failed, expired, cancelled or refunded can be set manually`
    : "Pick a new status to update this order";

  const statusDirty = status !== initialStatus;
  const paymentDirty = paymentStatus !== initialPaymentStatus;
  const anyDirty = statusDirty || (paymentDirty && !paymentBlockedReason);

  const hasCourierInfo =
    !!courierProvider || !!courierConsignmentId || !!courierTrackingUrl;

  return (
    <section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-primarymain/10 bg-gradient-to-r from-primarymain/10 via-primarymain/5 to-transparent px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primarymain text-white">
            <SlidersHorizontal className="size-4" strokeWidth={2.5} />
          </span>
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
            Manage Order
          </h3>
        </div>

        {readOnly ? (
          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
            Read only
          </span>
        ) : anyDirty ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
            <CircleAlert className="size-3" />
            Unsaved
          </span>
        ) : null}
      </header>

      <div className="space-y-4 p-5">
        {/* Courier block */}
        {(hasCourierInfo || canSendToCourier || (canUpdate && courierConsignmentId)) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                <Truck className="size-3" />
                Courier
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                  courierConsignmentId
                    ? "bg-emerald-100 text-emerald-700"
                    : courierProvider
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-500"
                )}
              >
                {courierConsignmentId
                  ? "Dispatched"
                  : courierProvider
                    ? "Ready to send"
                    : "Not assigned"}
              </span>
            </div>

            {(courierConsignmentId || courierProvider || courierTrackingUrl) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {courierConsignmentId ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span className="truncate">{courierConsignmentId}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    <Truck className="size-3" />
                    {courierProvider}
                  </span>
                )}

                {courierTrackingUrl && (
                  <a
                    href={courierTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 transition-colors hover:border-blue-300 hover:text-blue-800"
                  >
                    Track
                    <ArrowRight className="size-3" />
                  </a>
                )}
              </div>
            )}

            {(canSendToCourier || (canUpdate && courierConsignmentId)) && (
              <div className="mt-3 flex flex-col gap-2">
                {canSendToCourier && (
                  <button
                    type="button"
                    disabled={sendToCourierMutation.isPending}
                    onClick={() => sendToCourierMutation.mutate()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primarymain px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primarymain/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primarymain/40 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primarymain/30 bg-primarymain/5 px-4 py-2.5 text-sm font-bold text-primarymain transition-colors hover:bg-primarymain/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primarymain/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {syncCourierMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Sync status from courier
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status controls */}
        <div className="space-y-3">
          <StatusControl
            id="order-delivery-status"
            label="Delivery Status"
            hint="Pick a new status to update this order"
            options={ORDER_STATUS_OPTIONS}
            value={status}
            fromLabel={optionLabel(ORDER_STATUS_OPTIONS, initialStatus)}
            toLabel={optionLabel(ORDER_STATUS_OPTIONS, status)}
            dirty={statusDirty}
            pending={updateStatusMutation.isPending}
            disabled={readOnly}
            onChange={(v) => setStatus(v as OrderStatus)}
            onSave={() => updateStatusMutation.mutate(status)}
          />

          <StatusControl
            id="order-payment-status"
            label="Payment Status"
            hint={paymentHint}
            options={PAYMENT_STATUS_OPTIONS}
            value={paymentStatus}
            fromLabel={optionLabel(PAYMENT_STATUS_OPTIONS, initialPaymentStatus)}
            toLabel={optionLabel(PAYMENT_STATUS_OPTIONS, paymentStatus)}
            dirty={paymentDirty}
            pending={updatePaymentMutation.isPending}
            disabled={readOnly}
            restrictBadge={gatewayManaged ? `Paid via ${paidVia}` : undefined}
            blockedReason={paymentBlockedReason}
            onChange={(v) => setPaymentStatus(v as PaymentStatus)}
            onSave={() => updatePaymentMutation.mutate(paymentStatus)}
          />
        </div>

        {readOnly && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-500">
            You have view-only access to this order. Ask an administrator to grant the{" "}
            <span className="font-bold text-slate-700">order.update</span> permission to make
            changes.
          </p>
        )}
      </div>
    </section>
  );
}
