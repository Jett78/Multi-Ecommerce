"use client";

import * as React from "react";
import { X, Package, Truck, CreditCard, MapPin, User, Mail, Phone, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helper";
import { API_ROUTES } from "@/config/api-routes";
import { useCrud } from "@/hooks/useCRUD";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentStatuses: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-orange-100 text-orange-800 border-orange-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

interface OrderDetailDrawerProps {
  order: Order;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export default function OrderDetailDrawer({ order, onClose, onStatusUpdated }: OrderDetailDrawerProps) {
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(order.paymentStatus);
  const [updatingOrderStatus, setUpdatingOrderStatus] = React.useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = React.useState(false);

  const { put: updateOrderStatusMutation } = useCrud<{ status: OrderStatus }>({
    endpoint: API_ROUTES.ORDERS,
    queryKey: "admin-orders",
  });

  const { put: updatePaymentStatusMutation } = useCrud<{ paymentStatus: PaymentStatus }>({
    endpoint: API_ROUTES.ORDERS,
    queryKey: "admin-orders",
  });

  const handleOrderStatusChange = async (newStatus: OrderStatus) => {
    setUpdatingOrderStatus(true);
    try {
      await updateOrderStatusMutation.mutateAsync({
        id: `${order.id}/status`,
        data: { status: newStatus },
      });
      setOrderStatus(newStatus);
      showSuccess("Order status updated");
      onStatusUpdated();
    } catch (error) {
      showError("Failed to update order status");
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    setUpdatingPaymentStatus(true);
    try {
      await updatePaymentStatusMutation.mutateAsync({
        id: `${order.id}/payment-status`,
        data: { paymentStatus: newStatus },
      });
      setPaymentStatus(newStatus);
      showSuccess("Payment status updated");
      onStatusUpdated();
    } catch (error) {
      showError("Failed to update payment status");
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl">
        <div className="flex w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-500">{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Highlighted Status Badges */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery</span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor[orderStatus] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                  {orderStatuses.find((s) => s.value === orderStatus)?.label || orderStatus}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment</span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor[paymentStatus] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                  {paymentStatuses.find((s) => s.value === paymentStatus)?.label || paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Option</span>
                <span className="inline-flex items-center rounded-full border border-primarymain/30 bg-primarymain/10 px-2.5 py-1 text-xs font-semibold text-primarymain">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "khalti" ? "Khalti" : order.paymentMethod === "stripe" ? "Stripe" : order.paymentMethod || "N/A"}
                </span>
              </div>
            </div>

            {/* Status Controls */}
            <div className="grid grid-cols-2 gap-4">
              {/* Order Status */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order Status</span>
                </div>
                <select
                  value={orderStatus}
                  onChange={(e) => handleOrderStatusChange(e.target.value as OrderStatus)}
                  disabled={updatingOrderStatus}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none disabled:opacity-50"
                >
                  {orderStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {updatingOrderStatus && (
                  <p className="mt-1 text-xs text-gray-400">Updating...</p>
                )}
              </div>

              {/* Payment Status */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Status</span>
                </div>
                <select
                  value={paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                  disabled={updatingPaymentStatus}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none disabled:opacity-50"
                >
                  {paymentStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {updatingPaymentStatus && (
                  <p className="mt-1 text-xs text-gray-400">Updating...</p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{order.customerName || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{order.customerEmail || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{order.customerPhone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Shipping Address</span>
              </div>
              <p className="text-sm text-gray-900">{order.shippingAddress || "N/A"}</p>
              {order.billingAddress && order.billingAddress !== order.shippingAddress && (
                <>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Billing Address</p>
                  <p className="text-sm text-gray-900">{order.billingAddress}</p>
                </>
              )}
            </div>

            {/* Landmark */}
            {order.landmark && (
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Landmark</span>
                </div>
                <p className="text-sm text-gray-900">{order.landmark}</p>
              </div>
            )}

            {/* Order Items */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Items</span>
              </div>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × Rs. {item.unitPrice.toLocaleString()}</p>
                      </div>
                      <span className="ml-4 text-sm font-semibold text-gray-900">
                        Rs. {item.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No items</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Summary</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">- Rs. {order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">Rs. {order.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-sm font-bold text-gray-900">Rs. {order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="text-gray-900 font-medium">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "khalti" ? "Khalti" : order.paymentMethod === "stripe" ? "Stripe" : order.paymentMethod || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</span>
                </div>
                <p className="text-sm text-gray-900">{order.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="space-y-1 text-xs text-gray-500">
                <p>Created: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
