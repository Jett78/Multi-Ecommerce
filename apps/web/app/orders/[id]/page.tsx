"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { getOrderById } from "@/actions/order-action";
import type { Order, OrderItem } from "@/types/order";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" />, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-4 w-4" />, label: "Confirmed" },
  processing: { color: "bg-purple-100 text-purple-800", icon: <Package className="h-4 w-4" />, label: "Processing" },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: <Truck className="h-4 w-4" />, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" />, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" />, label: "Cancelled" },
};

const fallbackStatus: { color: string; icon: React.ReactNode; label: string } = { color: "bg-gray-100 text-gray-800", icon: <Package className="h-4 w-4" />, label: "Unknown" };

function getStatus(status: string | undefined) {
  return statusConfig[status || 'pending'] || fallbackStatus;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const result = await getOrderById(orderId);
        setOrder(result);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondarymain border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Order not found</h2>
            <Link
              href="/orders"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondarymain hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatus(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderId}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Items */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-900">Items</h2>
            <div className="mt-3 space-y-3">
              {order.items?.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl bg-gray-50 p-4"
                >
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200">
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      IMG
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Rs. {item.totalAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
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
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-base font-bold text-secondarymain">
                    Rs. {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="mt-6 grid gap-6 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Shipping Address</h3>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                {order.shippingAddress || "Not provided"}
              </p>
            </div>
            {order.landmark && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Landmark</h3>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{order.landmark}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
              <p className="mt-2 text-sm text-gray-600">
                Method: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
              </p>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    order.paymentStatus === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
