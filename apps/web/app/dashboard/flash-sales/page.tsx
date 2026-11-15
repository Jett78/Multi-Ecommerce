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
import { revalidateFlashSales } from "@/actions/revalidate-action";
import { useDebounce } from "@/hooks/useDebounce";
import type { FlashSale } from "@/types/flash-sale";

const PAGE_SIZE = 10;

function getSaleStatus(sale: FlashSale): { label: string; color: string } {
  const now = new Date();
  const startsAt = new Date(sale.startsAt);
  const endsAt = new Date(sale.endsAt);

  if (!sale.isActive) return { label: "Disabled", color: "bg-slate-100 text-slate-500" };
  if (now < startsAt) return { label: "Upcoming", color: "bg-amber-50 text-amber-700" };
  if (now > endsAt) return { label: "Ended", color: "bg-slate-100 text-slate-500" };
  return { label: "Active", color: "bg-emerald-50 text-emerald-700" };
}

export default function AdminFlashSalesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { getAllPaginated } = useCrud<FlashSale>({
    endpoint: API_ROUTES.FLASH_SALE,
    queryKey: "flash-sales",
  });

  const { data, isLoading, isError, error } = getAllPaginated({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const sales = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: Column<FlashSale>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <span className="font-bold text-sm text-slate-900">{row.name}</span>
      ),
    },
    {
      key: "startsAt",
      label: "Start Date",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.startsAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "endsAt",
      label: "End Date",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.endsAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.productsCount ?? 0}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => {
        const status = getSaleStatus(row);
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <DataTableActions
          editHref={`/dashboard/flash-sales/${row.id}/edit`}
          deleteId={row.id}
          deleteEndpoint={API_ROUTES.FLASH_SALE}
          deleteQueryKey="flash-sales"
          deleteEntityName="flash sale"
          onDeleteSuccess={revalidateFlashSales}
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
        title="Flash Sales"
        description="Manage time-limited flash sales for your store."
        path="flash-sales"
      />
      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by name..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={sales}
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
