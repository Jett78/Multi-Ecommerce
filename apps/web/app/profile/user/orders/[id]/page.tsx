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
  Loader2,
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
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
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/profile/user/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Receipt className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Order #{order.orderId}
                  </h1>
                  <button
                    onClick={copyOrderId}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                    title="Copy order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
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
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <DownloadInvoiceButton
              order={{
                ...order,
                items: order.items || [],
              }}
            />
            {order.courierTrackingUrl && (
              <a
                href={order.courierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Truck className="h-4 w-4" />
                Track Shipment
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="border-b border-gray-100 px-6 py-5">
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
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                            : "bg-gray-100 text-gray-400"
                        } ${isCurrent ? "ring-2 ring-indigo-200 ring-offset-2" : ""}`}
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
                        className={`mx-1 h-0.5 flex-1 rounded-full ${
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
          <div className="border-b border-gray-100 bg-rose-50/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-semibold text-rose-700">This order has been cancelled</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="px-6 py-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Box className="h-4 w-4 text-gray-400" />
            Items Ordered
          </h2>
          <div className="mt-4 space-y-3">
            {order.items?.map((item: OrderItem) => (
              <div
                key={item.id}
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-indigo-100 hover:bg-indigo-50/30"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="mt-0.5 text-xs text-gray-500">{item.variantName}</p>
                  )}
                  {item.attributes && item.attributes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.attributes.map((attr, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200"
                        >
                          {attr.attributeName}: {attr.attributeValue}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Qty: {item.quantity} &times; Rs. {item.unitPrice.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  Rs. {item.totalAmount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 px-6 py-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Receipt className="h-4 w-4 text-gray-400" />
            Order Summary
          </h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>
                  Discount
                  {order.orderCoupons && order.orderCoupons.length > 0 && (
                    <span className="ml-1 font-mono text-xs">({order.orderCoupons[0]?.couponCode})</span>
                  )}
                </span>
                <span>-Rs. {order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>Rs. {order.taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery</span>
              <span className={order.deliveryCharge > 0 ? "font-medium text-gray-900" : "font-medium text-emerald-600"}>
                {order.deliveryCharge > 0 ? `Rs. ${order.deliveryCharge.toLocaleString()}` : "Free"}
              </span>
            </div>
            <div className="my-2 border-t border-gray-100" />
            <div className="flex justify-between">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-base font-bold text-indigo-600">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="border-t border-gray-100 px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                Shipping Address
              </h3>
              <p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {order.shippingAddress || "Not provided"}
              </p>
              {order.landmark && (
                <p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Landmark:</span> {order.landmark}
                </p>
              )}
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <CreditCard className="h-4 w-4 text-gray-400" />
                Payment Details
              </h3>
              <div className="mt-2 rounded-xl bg-gray-50 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium text-gray-900">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : order.paymentMethod?.toUpperCase() || "\u2014"}
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

          {/* Shipment Tracking */}
          {(order.courierProvider || order.courierConsignmentId || order.courierTrackingUrl) && (
            <div className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Truck className="h-4 w-4 text-gray-400" />
                Shipment Tracking
              </h3>
              <div className="mt-2 rounded-xl bg-gray-50 p-3 space-y-2">
                {order.courierProvider && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Courier</span>
                    <span className="font-medium text-gray-900">{order.courierProvider}</span>
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
        </div>

        {/* Contact Info */}
        {(order.customerName || order.customerEmail || order.customerPhone) && (
          <div className="border-t border-gray-100 px-6 py-5">
            <h3 className="text-sm font-bold text-gray-900">Contact Information</h3>
            <div className="mt-2 rounded-xl bg-gray-50 p-3 space-y-1.5 text-sm">
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
          <div className="border-t border-gray-100 px-6 py-5">
            <h3 className="text-sm font-bold text-gray-900">Order Notes</h3>
            <p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-line">
              {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
