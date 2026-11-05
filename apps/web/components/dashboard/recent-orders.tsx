"use client";

import { Clock, ShoppingBag, CheckCircle, XCircle } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import Link from "next/link";

interface RecentOrder {
  id: string;
  orderId: string;
  customerName: string | null;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> },
  processing: { color: "bg-purple-100 text-purple-800", icon: <ShoppingBag className="h-3 w-3" /> },
  shipped: { color: "bg-indigo-100 text-indigo-800", icon: <ShoppingBag className="h-3 w-3" /> },
  delivered: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export function RecentOrders() {
  const { getAll } = useCrud<RecentOrder[]>({
    endpoint: `${API_ROUTES.DASHBOARD_RECENT_ORDERS}?limit=10`,
    queryKey: "dashboard-recent-orders",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAll();
  const recentOrders = (data as RecentOrder[]) || [];

  return (
    <div className="bg-white p-6 rounded-md border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          <h3 className="font-bold text-sm text-slate-900">Recent Orders</h3>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-xs text-primary hover:underline font-medium"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 border border-slate-100 rounded-lg">
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : recentOrders.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <ShoppingBag className="size-12 mx-auto mb-2 text-slate-300" />
          No orders yet
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map((order) => {
            const statusKey = order.status || "pending";
            const statusInfo = statusConfig[statusKey] || statusConfig.pending;
            const color = statusInfo?.color || "bg-gray-100 text-gray-800";
            const icon = statusInfo?.icon || <ShoppingBag className="h-3 w-3" />;
            
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-primary/30 hover:bg-slate-50 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-slate-900">
                      #{order.orderId.slice(-8)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
                      {icon}
                      {statusKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">
                    {order.customerName || "Guest"} • {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-sm text-slate-900">
                    Rs. {order.totalAmount.toLocaleString()}
                  </p>
                  <p className={`text-xs ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.paymentStatus}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
