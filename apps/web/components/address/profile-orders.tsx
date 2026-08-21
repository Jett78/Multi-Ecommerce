"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Eye, Clock, CheckCircle, Truck, XCircle, Loader2 } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Order } from "@/types/order";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" />, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" />, label: "Confirmed" },
  processing: { color: "bg-purple-100 text-purple-800", icon: <Package className="h-3 w-3" />, label: "Processing" },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: <Truck className="h-3 w-3" />, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" />, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
};

const fallbackStatus = { color: "bg-gray-100 text-gray-800", icon: <Package className="h-3 w-3" />, label: "Unknown" };

function getStatus(status: string | undefined) {
  return statusConfig[status || "pending"] || fallbackStatus;
}

export function ProfileOrders() {
  const crud = useCrud<Order>({
    endpoint: API_ROUTES.MY_ORDERS,
    queryKey: "my-orders",
    isAuthenticated: true,
  });

  const { data, isLoading } = crud.getAll();

  const orders: Order[] = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "orders" in data) return (data as any).orders || [];
    return [];
  }, [data]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-transparent">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primarymain" />
          <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
        </div>
        {orders.length > 0 && (
          <Link
            href="/profile/user/orders"
            className="text-xs font-medium text-primarymain hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primarymain" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = getStatus(order.status);
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Order #{order.orderId.slice(-8)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-primarymain">
                      Rs. {order.totalAmount.toLocaleString()}
                    </p>
                    <Link
                      href={`/profile/user/orders/${order.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
