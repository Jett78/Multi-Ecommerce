"use client";

import * as React from "react";
import { Package, Clock, CheckCircle, Truck, XCircle, Search } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { Input } from "@/components/ui/input";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import DataTable, { Column } from "@/components/dashboard/data-table";
import { EditButton } from "@/components/dashboard/edit-button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import type { Order, OrderStats } from "@/types/order";

const PAGE_SIZE = 10;

const selectClass = "h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary";

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

export default function AdminOrdersPage() {
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [sort, setSort] = React.useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = React.useState("");

  const resetFilters = () => {
    setStatusFilter("");
    setSort("desc");
    setPage(1);
  };

  const { getAllPaginated } = useCrud<Order>({
    endpoint: API_ROUTES.ORDERS,
    queryKey: "admin-orders",
  });

  const { getAll: getStats } = useCrud<OrderStats>({
    endpoint: API_ROUTES.ORDER_STATS,
    queryKey: "order-stats",
  });

  const params: Record<string, string | number> = {
    page,
    limit: PAGE_SIZE,
  };
  if (statusFilter) params.status = statusFilter;
  if (sort) params.sort = sort;

  const { data, isLoading, isError, error } = getAllPaginated(params);
  const { data: stats } = getStats();

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredOrders = React.useMemo(() => {
    const orders = data?.items || [];
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order: Order) =>
        order.orderId.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerEmail?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const columns: Column<Order>[] = [
    {
      key: "sn",
      label: "SN",
      render: (_row, index) => (
        <span className="text-sm text-gray-600">{(page - 1) * PAGE_SIZE + index + 1}</span>
      ),
    },
    {
      key: "orderId",
      label: "Order ID",
      render: (order) => (
        <span className="text-sm font-medium text-gray-900">{order.orderId}</span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (order) => (
        <div>
          <p className="text-sm text-gray-900">{order.customerName || "N/A"}</p>
          <p className="text-xs text-gray-500">{order.customerEmail || "N/A"}</p>
        </div>
      ),
    },
   
    {
      key: "total",
      label: "Total",
      render: (order) => (
        <span className="text-sm font-semibold text-gray-900">
          Rs. {order.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => {
        const status = getStatus(order.status);
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
        );
      },
    },
    {
      key: "payment",
      label: "Payment",
      render: (order) => (
        <span className="text-sm text-gray-600">
          {order.paymentMethod === "cod"
            ? "COD"
            : order.paymentMethod === "khalti"
            ? "Khalti"
            : order.paymentMethod === "stripe"
            ? "Stripe"
            : order.paymentMethod || "N/A"}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (order) => (
        <span className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (order) => (
        <div className="flex items-center justify-end gap-2">
          <EditButton href={`/dashboard/orders/${order.id}`} />
          <DeleteButton
            id={order.id}
            endpoint={API_ROUTES.ORDERS}
            queryKey="admin-orders"
            entityName="order"
          />
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-8 text-center text-rose-600 font-bold">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DashboardHeading
        title="Orders"
        description="Manage customer orders and fulfillment"
      />

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

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by order ID, customer name or email..."
            className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "asc" | "desc");
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>

          {(statusFilter || sort !== "desc") && (
            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:underline whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        skeletonRows={PAGE_SIZE}
        className="shadow-2xl shadow-slate-200/40"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <DashboardPagination page={page} setPage={setPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
