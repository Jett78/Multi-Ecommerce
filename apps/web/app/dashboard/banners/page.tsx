"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DataTable, { Column } from "@/components/dashboard/data-table";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { EditButton } from "@/components/dashboard/edit-button";
import { revalidateBanners } from "@/actions/revalidate-action";
import { useDebounce } from "@/hooks/useDebounce";
import type { Banner } from "@/types/banner";

const PAGE_SIZE = 10;

export default function BannersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { getAllPaginated } = useCrud<Banner>({
    endpoint: API_ROUTES.BANNER,
    queryKey: "banners",
  });

  const { data, isLoading, isError, error } = getAllPaginated({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const banners = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: Column<Banner>[] = [
    {
      key: "sortOrder",
      label: "Order",
      render: (row) => (
        <span className="font-bold text-slate-900">{row.sortOrder}</span>
      ),
    },
    {
      key: "imageUrl",
      label: "Image",
      render: (row) => (
        <div className="relative h-12 w-20 overflow-hidden rounded-md border border-slate-200">
          <Image
            src={row.imageUrl}
            alt={row.title}
            fill
            className="object-cover"
          />
        </div>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <span className="font-bold text-slate-900">{row.title}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
            row.type === "hero"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: "link",
      label: "Link",
      render: (row) => (
        <span className="text-xs text-slate-600 max-w-xs truncate block">
          {row.link || "-"}
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
        <div className="flex items-center justify-end gap-2">
          <EditButton href={`/dashboard/banners/${row.id}/edit`} />
          <DeleteButton
            id={row.id}
            endpoint={API_ROUTES.BANNER}
            queryKey="banners"
            entityName="Banner"
            onSuccess={revalidateBanners}
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
        title="Banners"
        description="Manage hero and mid-page banners."
        path="banners"
      />
      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by title..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={banners}
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
