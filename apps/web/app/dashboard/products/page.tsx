"use client";

import { useState } from "react";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DataTable, { Column } from "@/components/dashboard/data-table";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { EditButton } from "@/components/dashboard/edit-button";
import { revalidateProducts } from "@/actions/revalidate-action";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import type { Product } from "@/types/product";

const PAGE_SIZE = 10;

const selectClass = "h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isFeatured, setIsFeatured] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);

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

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "SN",
      render: (_row, rowIndex) => (
        <span className="text-sm text-slate-600">{(page - 1) * PAGE_SIZE + rowIndex + 1}</span>
      ),
    },
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          {(() => {
            const primaryImage = row.images?.find((img) => img.isPrimary) || row.images?.[0];
            return primaryImage?.url ? (
              <Image
                src={primaryImage.url}
                alt={row.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                {row.name.charAt(0).toUpperCase()}
              </div>
            );
          })()}
          <div>
            <span className="font-bold text-slate-900">{row.name}</span>
            <p className="text-xs text-slate-400">{row.sku || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.category?.name || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : row.status === "draft"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "featured",
      label: "Featured",
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.isFeatured ? "★" : "—"}
        </span>
      ),
    },
    {
      key: "stockQuantity",
      label: "Stock",
      render: (row) => {
        if (row.variants && row.variants.length > 0) {
          const totalStock = row.variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);
          const minThreshold = Math.min(...row.variants.map((v) => v.lowStockThreshold ?? 5));
          const isLow = totalStock <= minThreshold;
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isLow && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
              {totalStock} out of {row.variants.length} variants
            </span>
          );
        }
        const stock = row.stockQuantity ?? 0;
        const threshold = row.lowStockThreshold ?? 5;
        const isLow = stock <= threshold;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isLow && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            {stock}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <EditButton href={`/dashboard/products/edit/${row.id}`} />
          <DeleteButton
            id={row.id}
            endpoint={API_ROUTES.PRODUCT}
            queryKey="products"
            entityName="product"
            onSuccess={revalidateProducts}
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
        title="Products"
        description="Manage your product catalog."
        path="products"
      />

      {/* Search */}
      <div className="relative w-full shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by name..."
          className="pl-10 h-11 bg-white border-slate-200 rounded-md focus:ring-primary/20 focus:border-primary transition-all font-medium"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-md border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
            value={isFeatured}
            onChange={(e) => handleFilterChange(setIsFeatured)(e.target.value)}
            className={selectClass}
          >
            <option value="">All Featured</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
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
