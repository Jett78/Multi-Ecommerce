"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Eye, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { getMyOrders } from "@/actions/order-action";
import type { Order, OrderListResponse } from "@/types/order";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" />, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" />, label: "Confirmed" },
  processing: { color: "bg-purple-100 text-purple-800", icon: <Package className="h-3 w-3" />, label: "Processing" },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: <Truck className="h-3 w-3" />, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" />, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
};

const fallbackStatus: { color: string; icon: React.ReactNode; label: string } = { color: "bg-gray-100 text-gray-800", icon: <Package className="h-3 w-3" />, label: "Unknown" };

function getStatus(status: string | undefined) {
  return statusConfig[status || 'pending'] || fallbackStatus;
}

export default function OrdersPage() {
  const [ordersData, setOrdersData] = React.useState<OrderListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await getMyOrders(page, 10);
        setOrdersData(result);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondarymain border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Package className="h-6 w-6 text-secondarymain" />
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              Start shopping to place your first order.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondarymain px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondarymain/90"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => {
              const status = getStatus(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Order #{order.orderId}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-secondarymain">
                          Rs. {order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-secondarymain hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
