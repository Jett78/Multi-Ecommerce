"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/dashboard/data-table";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { Search, Download, Upload, Trash2, Loader2, Plus, X, SlidersHorizontal, Package, CheckCircle2, AlertTriangle, Star, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { DataTableActions } from "@/components/dashboard/data-table-actions";
import { revalidateProducts } from "@/actions/revalidate-action";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { productsToCsvRows, downloadCsv } from "@/lib/csv-helpers";
import { showSuccess, showError } from "@/lib/toast-helper";
import { apiClient } from "@/lib/api-client";
import CsvImportDialog from "@/components/dashboard/csv-import-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/types/product";
import DashboardHeading from "@/components/dashboard/dashboard-heading";

const PAGE_SIZE = 10;

const selectClass = "h-10 rounded-md border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat";

function StatCard({ icon: Icon, iconBg, iconColor, label, value }: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className={`flex items-center justify-center size-12 rounded-xl ${iconBg}`}>
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isFeatured, setIsFeatured] = useState("");
  const [status, setStatus] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();

  const { getAllPaginated } = useCrud<Product>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "products",
  });

  const { getAll: getCategories } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "categories",
  });
  const { getAll: getSubcategories } = useCrud<{ id: string; name: string; categoryId: string }>({
    endpoint: API_ROUTES.SUBCATEGORY,
    queryKey: "subcategories",
  });
  const { getAll: getBrands } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.BRAND,
    queryKey: "brands",
  });

  const { data: categoriesData } = getCategories({ take: 100, skip: 0 });
  const { data: subcategoriesData } = getSubcategories({ take: 100, skip: 0 });
  const { data: brandsData } = getBrands({ take: 100, skip: 0 });

  const categories: { id: string; name: string }[] = categoriesData || [];
  const allSubcategories: { id: string; name: string; categoryId: string }[] = subcategoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];

  const subcategories = categoryId
    ? allSubcategories.filter((sub) => sub.categoryId === categoryId)
    : allSubcategories;

  const { data, isLoading, isError, error } = getAllPaginated({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(subcategoryId ? { subcategoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(isFeatured ? { isFeatured: isFeatured === "true" } : {}),
    ...(status ? { status } : {}),
  });

  const products = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const { data: activeData } = getAllPaginated({ take: 1, skip: 0, status: "active" });
  const activeCount = activeData?.total || 0;

  const { data: featuredData } = getAllPaginated({ take: 1, skip: 0, isFeatured: true });
  const featuredCount = featuredData?.total || 0;

  const { data: outOfStockData } = getAllPaginated({ take: 1, skip: 0, stockStatus: "out_of_stock" });
  const outOfStockCount = outOfStockData?.total || 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (setter: (val: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setIsFeatured("");
    setStatus("");
    setPage(1);
  };

  const hasActiveFilters = categoryId || subcategoryId || brandId || isFeatured || status;

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        products.forEach((p) => next.delete(p.id));
      } else {
        products.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selectedIds];
      for (const id of ids) {
        await apiClient(`${API_ROUTES.PRODUCT}/${id}`, {
          method: "DELETE",
          isAuthenticated: true,
        });
      }
    },
    onSuccess: () => {
      showSuccess(`Deleted ${selectedIds.size} product(s)`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      revalidateProducts();
    },
    onError: () => {
      showError("Failed to delete some products");
      setBulkDeleteOpen(false);
    },
  });

  const handleExportCsv = async () => {
    try {
      const allProducts: Product[] = [];
      let skip = 0;
      const take = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await apiClient<{ data: Product[]; total: number }>(
          `${API_ROUTES.PRODUCT}?take=${take}&skip=${skip}`
        );
        const items: Product[] = response?.data || [];
        allProducts.push(...items);
        skip += take;
        hasMore = items.length === take && skip < (response?.total || 0);
      }

      if (allProducts.length === 0) {
        showError("No products to export");
        return;
      }
      const rows = productsToCsvRows(allProducts);
      const date = new Date().toISOString().split("T")[0];
      downloadCsv(rows, `products-export-${date}.csv`);
      showSuccess(`Exported ${allProducts.length} product(s) to CSV`);
    } catch {
      showError("Failed to export products");
    }
  };

  const getCategoryName = (row: Product) => row.category?.name || "—";
  const getStockLabel = (row: Product) => {
    if (row.variants && row.variants.length > 0) {
      const totalStock = row.variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);
      return { stock: totalStock, variants: row.variants.length };
    }
    return { stock: row.stockQuantity ?? 0, variants: 1 };
  };

  const columns: Column<Product>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/20"
          checked={allSelected}
          disabled={products.length === 0}
          onChange={toggleSelectAll}
          aria-label="Select all products"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/20"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelectOne(row.id)}
          aria-label={`Select ${row.name}`}
        />
      ),
    },
    {
      key: "sn",
      label: "SN",
      render: (_row, rowIndex) => (
        <span className="text-sm text-slate-500 font-medium">{(page - 1) * PAGE_SIZE + rowIndex + 1}</span>
      ),
    },
    {
      key: "name",
      label: "PRODUCT",
      render: (row) => (
        <div className="flex items-center gap-3">
          {(() => {
            const primaryImage = row.images?.find((img) => img.isPrimary) || row.images?.[0];
            return primaryImage?.url ? (
              <Image
                src={primaryImage.url}
                alt={row.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-lg object-cover border border-slate-100"
              />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold">
                {row.name.charAt(0).toUpperCase()}
              </div>
            );
          })()}
          <div>
            <span className="font-semibold text-slate-900 text-sm">{row.name}</span>
            <p className="text-xs text-slate-400">SKU: {row.sku || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "CATEGORY",
      render: (row) => (
        <span className="text-sm text-slate-600 font-medium">
          {getCategoryName(row)}
        </span>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : row.status === "draft"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <span className={`size-1.5 rounded-full ${
            row.status === "active" ? "bg-emerald-500" : row.status === "draft" ? "bg-amber-500" : "bg-slate-400"
          }`} />
          {row.status}
        </span>
      ),
    },
    {
      key: "featured",
      label: "FEATURED",
      render: (row) => (
        row.isFeatured ? (
          <Star className="size-4 fill-amber-400 text-amber-400" />
        ) : (
          <span className="text-slate-300">—</span>
        )
      ),
    },
    {
      key: "stock",
      label: "STOCK",
      render: (row) => {
        const { stock, variants } = getStockLabel(row);
        const isLow = row.variants && row.variants.length > 0
          ? stock <= Math.min(...row.variants.map((v) => v.lowStockThreshold ?? 5))
          : stock <= (row.lowStockThreshold ?? 5);
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isLow ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {stock} out of {variants} variants
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      className: "text-right",
      render: (row) => (
        <DataTableActions
          viewHref={`/products/${row.slug}`}
          editHref={`/dashboard/products/edit/${row.id}`}
          deleteId={row.id}
          deleteEndpoint={API_ROUTES.PRODUCT}
          deleteQueryKey="products"
          deleteEntityName="product"
          onDeleteSuccess={revalidateProducts}
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <DashboardHeading
        title="Products"
        description="Manage your product catalog."
        path="products"
      
      />


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Products"
          value={total}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Active Products"
          value={activeCount}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Out of Stock"
          value={outOfStockCount || "—"}
        />
        <StatCard
          icon={Star}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Featured Products"
          value={featuredCount}
        />
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search by product name, SKU, or keyword..."
              className="pl-10 h-10 bg-white border-slate-200 rounded-lg text-sm"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {/* Filter, Export, Import buttons */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-1.5 h-10 px-4 ${hasActiveFilters ? "bg-primarymain hover:bg-primarymain/90 text-white" : ""}`}
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            <ChevronDown className={`size-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 h-10 px-4"
          >
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-1.5 h-10 px-4"
          >
            <Upload className="size-3.5" />
            Import
          </Button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryId}
              onChange={(e) => {
                handleFilterChange(setCategoryId)(e.target.value);
                setSubcategoryId("");
              }}
              className={selectClass}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={subcategoryId}
              onChange={(e) => handleFilterChange(setSubcategoryId)(e.target.value)}
              className={selectClass}
              disabled={!categoryId}
            >
              <option value="">All Subcategories</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>

            <select
              value={brandId}
              onChange={(e) => handleFilterChange(setBrandId)(e.target.value)}
              className={selectClass}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
              className={selectClass}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={isFeatured}
              onChange={(e) => handleFilterChange(setIsFeatured)(e.target.value)}
              className={selectClass}
            >
              <option value="">All Featured</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
            {hasActiveFilters && (
              <Button
                variant="destructive"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5 h-10 px-4 bg-red-500 hover:bg-red-600 text-white"
              >
                <X className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {categoryId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                Category: {categories.find((c) => c.id === categoryId)?.name}
                <button onClick={() => { setCategoryId(""); setSubcategoryId(""); }} className="hover:text-blue-900">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {subcategoryId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                Subcategory: {allSubcategories.find((s) => s.id === subcategoryId)?.name}
                <button onClick={() => setSubcategoryId("")} className="hover:text-blue-900">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {brandId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                Brand: {brands.find((b) => b.id === brandId)?.name}
                <button onClick={() => setBrandId("")} className="hover:text-blue-900">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                Status: {status}
                <button onClick={() => setStatus("")} className="hover:text-blue-900">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {isFeatured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                Featured: {isFeatured === "true" ? "Yes" : "No"}
                <button onClick={() => setIsFeatured("")} className="hover:text-blue-900">
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-semibold text-red-700">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:underline"
            >
              Clear
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkDeleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        className="shadow-2xl shadow-slate-200/40"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} products
        </p>
        {totalPages > 1 && (
          <DashboardPagination
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        )}
      </div>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} product(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate()}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CsvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          setPage(1);
          setSearch("");
        }}
        categories={categories}
        subcategories={allSubcategories}
        brands={brands}
      />
    </div>
  );
}
