"use client";

import * as React from "react";
import Link from "next/link";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Order } from "@/types/order";
import DataTable, { Column } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import { Search, Eye, Clock, CheckCircle, Package, Truck, XCircle, Banknote, CreditCard } from "lucide-react";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" },
  confirmed: { color: "bg-sky-50 text-sky-700 border-sky-200", label: "Confirmed" },
  processing: { color: "bg-violet-50 text-violet-700 border-violet-200", label: "Processing" },
  shipped: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Shipped" },
  delivered: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Delivered" },
  cancelled: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled" },
};

const fallbackStatus = { color: "bg-slate-50 text-slate-700 border-slate-200", label: "Unknown" };

function getStatus(status: string | undefined) {
  return statusConfig[status || "pending"] || fallbackStatus;
}

const paymentLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  khalti: "Khalti",
  stripe: "Stripe",
};

export default function ProfileOrdersPage() {
  const [search, setSearch] = React.useState("");

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

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(search.toLowerCase()) ||
          o.status?.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const columns: Column<Order>[] = [
    {
      key: "orderId",
      label: "Order",
      render: (row) => (
        <span className="font-bold text-slate-900">#{row.orderId.slice(-8)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = getStatus(row.status);
        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {paymentLabels[row.paymentMethod || "cod"] || row.paymentMethod || "\u2014"}
        </span>
      ),
    },
    {
      key: "discountAmount",
      label: "Discount",
      render: (row) => (
        <span className={`text-xs ${row.discountAmount > 0 ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
          {row.discountAmount > 0 ? `- Rs. ${row.discountAmount.toLocaleString()}` : "\u2014"}
        </span>
      ),
    },
    {
      key: "deliveryCharge",
      label: "Delivery",
      render: (row) => (
        <span className={`text-xs ${row.deliveryCharge > 0 ? "text-slate-700 font-medium" : "text-emerald-600 font-medium"}`}>
          {row.deliveryCharge > 0 ? `Rs. ${row.deliveryCharge.toLocaleString()}` : "Free"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-900">Rs. {row.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <Link
          href={`/profile/user/orders/${row.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
        >
          <Eye className="size-3" /> View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Orders</h1>
        <p className="mt-1 text-sm text-slate-500">View and track all your orders.</p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by order ID, status, or customer..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        className="shadow-2xl shadow-slate-200/40"
      />
    </div>
  );
}
