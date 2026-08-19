"use client";

import * as React from "react";
import { Package, Eye, Clock, CheckCircle, Truck, XCircle, Search, Filter } from "lucide-react";
import { getAllOrders, updateOrderStatus, getOrderStats } from "@/actions/order-action";
import type { Order, OrderListResponse, OrderStats } from "@/types/order";

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

export default function AdminOrdersPage() {
  const [ordersData, setOrdersData] = React.useState<OrderListResponse | null>(null);
  const [stats, setStats] = React.useState<OrderStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersResult, statsResult] = await Promise.all([
          getAllOrders(page, 10, statusFilter ? { status: statusFilter } : undefined),
          getOrderStats(),
        ]);
        setOrdersData(ordersResult);
        setStats(statsResult);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Refresh orders
      const result = await getAllOrders(page, 10, statusFilter ? { status: statusFilter } : undefined);
      setOrdersData(result);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const filteredOrders = ordersData?.orders.filter((order: Order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query)
    );
  }) || [];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondarymain border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage customer orders and fulfillment</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              Rs. {stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-500">Pending Orders</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-500">Shipped Orders</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{stats.shippedOrders}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-secondarymain focus:ring-2 focus:ring-secondarymain/20 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondarymain focus:ring-2 focus:ring-secondarymain/20 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order: Order) => {
                const status = getStatus(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{order.orderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{order.customerName || "N/A"}</p>
                        <p className="text-xs text-gray-500">{order.customerEmail || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        Rs. {order.totalAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {order.paymentMethod === "cod"
                          ? "COD"
                          : order.paymentMethod === "khalti"
                          ? "Khalti"
                          : order.paymentMethod === "stripe"
                          ? "Stripe"
                          : order.paymentMethod || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-secondarymain focus:outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {ordersData && ordersData.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, ordersData.totalCount)} of{" "}
            {ordersData.totalCount} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {ordersData.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(ordersData.totalPages, page + 1))}
              disabled={page === ordersData.totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
