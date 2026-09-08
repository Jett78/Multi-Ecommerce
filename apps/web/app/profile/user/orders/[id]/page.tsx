"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Order, OrderItem } from "@/types/order";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  Copy,
  Box,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { showSuccess } from "@/lib/toast-helper";
import DownloadInvoiceButton from "@/components/invoices/download-invoice-button";

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: <Clock className="h-4 w-4" />, label: "Pending" },
  confirmed: { color: "bg-sky-50 text-sky-700 ring-sky-600/20", icon: <CheckCircle className="h-4 w-4" />, label: "Confirmed" },
  processing: { color: "bg-violet-50 text-violet-700 ring-violet-600/20", icon: <Package className="h-4 w-4" />, label: "Processing" },
  shipped: { color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", icon: <Truck className="h-4 w-4" />, label: "Shipped" },
  delivered: { color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: <CheckCircle className="h-4 w-4" />, label: "Delivered" },
  cancelled: { color: "bg-rose-50 text-rose-700 ring-rose-600/20", icon: <XCircle className="h-4 w-4" />, label: "Cancelled" },
};

const fallbackStatus = { color: "bg-gray-50 text-gray-700 ring-gray-600/20", icon: <Package className="h-4 w-4" />, label: "Unknown" };

function getStatus(status: string | undefined) {
  return statusConfig[status || "pending"] || fallbackStatus;
}

export default function ProfileOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const crud = useCrud<Order>({
    endpoint: API_ROUTES.ORDERS,
    queryKey: "my-orders",
    isAuthenticated: true,
  });

  const { data, isLoading, isError } = crud.getOne(orderId);

  const order = React.useMemo(() => {
    if (!data) return null;
    if (typeof data === "object" && "id" in data) return data as Order;
    return null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gray-200" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-3 w-56 rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="h-0.5 flex-1 self-center rounded bg-gray-100" />
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="h-0.5 flex-1 self-center rounded bg-gray-100" />
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="h-16 w-16 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-20 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center ">
        <h2 className="text-lg font-bold text-gray-900">Order not found</h2>
        <Link
          href="/profile/user/orders"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const status = getStatus(order.status);
  const isCancelled = order.status === "cancelled";
  const currentStepIndex = isCancelled ? -1 : statusSteps.indexOf(order.status || "pending");

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    showSuccess("Order ID copied!");
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <Link
        href="/profile/user/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="rounded-2xl border border-gray-100 bg-white">
        {/* Header */}
        <div className="border-b border-gray-50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Receipt className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-gray-900">
                    Order #{order.orderId}
                  </h1>
                  <button
                    onClick={copyOrderId}
                    className="rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
                    title="Copy order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>
              <DownloadInvoiceButton
                order={{ ...order, items: order.items || [] }}
              />
              {order.courierTrackingUrl && (
                <a
                  href={order.courierTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Track
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="border-b border-gray-50 px-6 py-5">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          isCompleted
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        } ${isCurrent ? "ring-2 ring-indigo-100 ring-offset-2" : ""}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold capitalize ${
                          isCompleted ? "text-indigo-600" : "text-gray-400"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`mx-1 mb-5 h-0.5 flex-1 rounded-full ${
                          i < currentStepIndex ? "bg-indigo-600" : "bg-gray-100"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="border-b border-gray-50 bg-rose-50/50 px-6 py-3.5">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-700">This order has been cancelled</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="px-6 py-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Items ({order.items?.length || 0})
          </h2>
          <div className="space-y-3">
            {order.items?.map((item: OrderItem) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100/60"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="mt-0.5 text-xs text-gray-400">{item.variantName}</p>
                  )}
                  {item.attributes && item.attributes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.attributes.map((attr, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-100"
                        >
                          {attr.attributeValue}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {item.quantity} × Rs. {item.unitPrice.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  Rs. {item.totalAmount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-50 px-6 py-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Summary
          </h2>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>
                  Discount
                  {order.orderCoupons && order.orderCoupons.length > 0 && (
                    <span className="ml-1 font-mono text-xs">({order.orderCoupons[0]?.couponCode})</span>
                  )}
                </span>
                <span className="font-medium">-Rs. {order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium text-gray-900">Rs. {order.taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className={`font-medium ${order.deliveryCharge > 0 ? "text-gray-900" : "text-emerald-600"}`}>
                {order.deliveryCharge > 0 ? `Rs. ${order.deliveryCharge.toLocaleString()}` : "Free"}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-1">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-sm font-bold text-indigo-600">
                  Rs. {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="border-t border-gray-50 px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Shipping Address
              </h3>
              <p className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {order.shippingAddress || "Not provided"}
              </p>
              {order.landmark && (
                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Landmark:</span> {order.landmark}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Payment
              </h3>
              <div className="rounded-lg bg-gray-50 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    {order.paymentMethod === "khalti" && (
                      <img src="/icons/khalti.png" alt="Khalti" className="h-5 w-5 object-contain" />
                    )}
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : order.paymentMethod?.toUpperCase() || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      order.paymentStatus === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.paymentStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Transaction</span>
                    <span className="font-mono text-xs text-gray-600">{order.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Tracking */}
        {(order.courierProvider || order.courierConsignmentId || order.courierTrackingUrl) && (
          <div className="border-t border-gray-50 px-6 py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Shipment Tracking
            </h3>
            <div className="rounded-lg bg-gray-50 p-3 space-y-2.5">
              {order.courierProvider && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Courier</span>
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    <img src="/icons/pathao.png" alt={order.courierProvider} className="h-5 w-5 object-contain" />
                    {order.courierProvider}
                  </span>
                </div>
              )}
              {order.courierConsignmentId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Consignment ID</span>
                  <span className="font-mono text-xs font-medium text-gray-900">{order.courierConsignmentId}</span>
                </div>
              )}
              {order.courierStatus && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {order.courierStatus}
                  </span>
                </div>
              )}
              {order.courierTrackingUrl && (
                <div className="pt-1">
                  <a
                    href={order.courierTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    Track on courier website
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(order.customerName || order.customerEmail || order.customerPhone) && (
          <div className="border-t border-gray-50 px-6 py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Contact
            </h3>
            <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
              {order.customerName && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-700">Name:</span> {order.customerName}
                </p>
              )}
              {order.customerEmail && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-700">Email:</span> {order.customerEmail}
                </p>
              )}
              {order.customerPhone && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-700">Phone:</span> {order.customerPhone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="border-t border-gray-50 px-6 py-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Order Notes
            </h3>
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
