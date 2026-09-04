"use client";

import { useState } from "react";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DataTable, { Column } from "@/components/dashboard/data-table";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { DataTableActions } from "@/components/dashboard/data-table-actions";
import { revalidateCoupons } from "@/actions/revalidate-action";
import { useDebounce } from "@/hooks/useDebounce";
import type { Coupon } from "@/types/coupon";

const PAGE_SIZE = 10;

const typeLabels: Record<string, { label: string; color: string }> = {
  fixed: { label: "Fixed Amount", color: "bg-blue-100 text-blue-800" },
  percentage: { label: "Percentage", color: "bg-purple-100 text-purple-800" },
  free_shipping: { label: "Free Shipping", color: "bg-emerald-100 text-emerald-800" },
};

function formatValue(coupon: Coupon) {
  if (coupon.type === "fixed") return `Rs. ${(coupon.value / 100).toLocaleString()}`;
  if (coupon.type === "percentage") return `${coupon.value}%`;
  return "Free";
}

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { getAllPaginated } = useCrud<Coupon>({
    endpoint: API_ROUTES.DISCOUNT,
    queryKey: "coupons",
  });

  const { data, isLoading, isError, error } = getAllPaginated({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const coupons = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="font-mono font-bold text-sm">{row.code}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => {
        const config = typeLabels[row.type] || { label: row.type, color: "bg-gray-100 text-gray-800" };
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: "value",
      label: "Value",
      render: (row) => <span className="font-bold text-slate-900">{formatValue(row)}</span>,
    },
    {
      key: "usageCount",
      label: "Usage",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.usageCount}{row.usageLimit ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "applicability",
      label: "Applies To",
      render: (row) => {
        const hasCategories = row.categoryIds && row.categoryIds.length > 0;
        const hasBrands = row.brandIds && row.brandIds.length > 0;

        if (!hasCategories && !hasBrands) {
          return <span className="text-xs text-slate-500">All Products</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {hasCategories && (
              <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                {row.categoryIds!.length} {row.categoryIds!.length === 1 ? "Category" : "Categories"}
              </span>
            )}
            {hasBrands && (
              <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full">
                {row.brandIds!.length} {row.brandIds!.length === 1 ? "Brand" : "Brands"}
              </span>
            )}
            {hasCategories && hasBrands && (
              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full uppercase">
                {row.filterLogic || "and"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "startsAt",
      label: "Start Date",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "expiresAt",
      label: "End Date",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
            row.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <DataTableActions
          editHref={`/dashboard/coupons/${row.id}/edit`}
          deleteId={row.id}
          deleteEndpoint={API_ROUTES.DISCOUNT}
          deleteQueryKey="coupons"
          deleteEntityName="coupon"
          onDeleteSuccess={revalidateCoupons}
        />
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
        title="Coupons"
        description="Manage discount coupons for your store."
        path="coupons"
      />
      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by code or description..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        className="shadow-2xl shadow-slate-200/40"
      />

      {totalPages > 1 && (
        <DashboardPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
