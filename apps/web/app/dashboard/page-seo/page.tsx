"use client";

import { useState } from "react";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { PageSeoManager } from "@/components/dashboard/page-seo-manager";
import { useDebounce } from "@/hooks/useDebounce";
import type { PageSeo } from "@/types/page-seo";

const PAGE_SIZE = 10;

export default function PageSeoPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { getAllPaginated } = useCrud<PageSeo>({
    endpoint: API_ROUTES.PAGE_SEO,
    queryKey: "page-seo",
    isAuthenticated: true,
  });

  const { data, isLoading, isError, error } = getAllPaginated({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const pages = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
        title="Page SEO"
        description="Manage meta tags for individual pages"
        path="page-seo"
      />
      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by page title or path..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <PageSeoManager pages={pages} isLoading={isLoading} />

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
