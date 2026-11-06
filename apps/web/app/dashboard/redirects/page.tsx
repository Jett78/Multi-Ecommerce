"use client";

import { useState, useEffect } from "react";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DataTable, { Column } from "@/components/dashboard/data-table";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { DataTableActions } from "@/components/dashboard/data-table-actions";
import { revalidateRedirects } from "@/actions/revalidate-action";
import type { Redirect } from "@/types/redirect";
import { ErrorBoundary } from "@/components/error-boundary";

function RedirectsContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { getAll } = useCrud<Redirect>({
    endpoint: API_ROUTES.REDIRECT,
    queryKey: "redirects",
    isAuthenticated: true,
  });

  const { data, isLoading, isError, error } = getAll({ take: 50 }, { timeout: 60000 });

  const redirects = (data as Redirect[]) || [];

  const filteredRedirects = redirects.filter(
    (r) =>
      r.fromPath.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.toPath.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const columns: Column<Redirect>[] = [
    {
      key: "fromPath",
      label: "From",
      render: (row) => (
        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
          {row.fromPath}
        </span>
      ),
    },
    {
      key: "toPath",
      label: "To",
      render: (row) => (
        <div className="flex items-center gap-2">
          <ArrowRight className="size-4 text-slate-400" />
          <span className="font-mono text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
            {row.toPath}
          </span>
        </div>
      ),
    },
    {
      key: "statusCode",
      label: "Code",
      render: (row) => {
        const labels: Record<number, string> = {
          301: "Moved Permanently",
          302: "Found (Temporary)",
          307: "Temporary Redirect",
          308: "Permanent Redirect",
          410: "Gone",
        };
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.statusCode} {labels[row.statusCode] || ""}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
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
          editHref={`/dashboard/redirects/${row.id}/edit`}
          deleteId={row.id}
          deleteEndpoint={API_ROUTES.REDIRECT}
          deleteQueryKey="redirects"
          deleteEntityName="redirect"
          onDeleteSuccess={revalidateRedirects}
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
        title="Redirects"
        description="Manage URL redirects for SEO preservation."
        path="redirects"
      />

      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by path..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRedirects}
        isLoading={isLoading}
        className="shadow-2xl shadow-slate-200/40"
      />
    </div>
  );
}

export default function RedirectsPage() {
  return (
    <ErrorBoundary>
      <RedirectsContent />
    </ErrorBoundary>
  );
}
