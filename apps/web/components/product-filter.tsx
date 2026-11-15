"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { X, SlidersHorizontal, Check, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  name: string;
}

interface FilterState {
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
}

interface ProductFilterProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const DEFAULT_FILTERS: FilterState = {
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
};

const FILTER_LABELS: Record<string, string> = {
  categoryId: "Category",
  subcategoryId: "Subcategory",
  brandId: "Brand",
  minPrice: "Min Price",
  maxPrice: "Max Price",
  minRating: "Rating",
};

export default function ProductFilter({ onFilterChange, initialFilters = {} }: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    categoryId: initialFilters.categoryId || "",
    subcategoryId: initialFilters.subcategoryId || "",
    brandId: initialFilters.brandId || "",
    minPrice: initialFilters.minPrice || "",
    maxPrice: initialFilters.maxPrice || "",
    minRating: initialFilters.minRating || "",
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { getAll: getCategories } = useCrud<FilterOption>({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "public-categories",
  });

  const { getAll: getSubcategories } = useCrud<FilterOption & { categoryId: string }>({
    endpoint: API_ROUTES.SUBCATEGORY,
    queryKey: "public-subcategories",
  });

  const { getAll: getBrands } = useCrud<FilterOption>({
    endpoint: API_ROUTES.BRAND,
    queryKey: "public-brands",
  });

  const { data: categoriesData } = getCategories({ take: 100, skip: 0, isActive: true });
  const { data: subcategoriesData } = getSubcategories({ take: 100, skip: 0, isActive: true });
  const { data: brandsData } = getBrands({ take: 100, skip: 0 });

  const categories = categoriesData || [];
  const allSubcategories = subcategoriesData || [];
  const brands = brandsData || [];

  const filteredSubcategories = filters.categoryId
    ? allSubcategories.filter((sub: FilterOption & { categoryId: string }) => sub.categoryId === filters.categoryId)
    : allSubcategories;

  const hasActiveFilters =
    filters.categoryId || filters.subcategoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.minRating;

  // Active filter chips for mobile display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
    if (filters.categoryId) {
      const cat = categories.find((c: FilterOption) => c.id === filters.categoryId);
      active.push({ key: "categoryId", label: "Category", value: cat?.name || filters.categoryId, onRemove: () => updateFilter("categoryId", "") });
    }
    if (filters.subcategoryId) {
      const sub = allSubcategories.find((s: FilterOption & { categoryId: string }) => s.id === filters.subcategoryId);
      active.push({ key: "subcategoryId", label: "Subcategory", value: sub?.name || filters.subcategoryId, onRemove: () => updateFilter("subcategoryId", "") });
    }
    if (filters.brandId) {
      const brand = brands.find((b: FilterOption) => b.id === filters.brandId);
      active.push({ key: "brandId", label: "Brand", value: brand?.name || filters.brandId, onRemove: () => updateFilter("brandId", "") });
    }
    if (filters.minPrice) {
      active.push({ key: "minPrice", label: "Min Price", value: `Rs. ${filters.minPrice}`, onRemove: () => updateFilter("minPrice", "") });
    }
    if (filters.maxPrice) {
      active.push({ key: "maxPrice", label: "Max Price", value: `Rs. ${filters.maxPrice}`, onRemove: () => updateFilter("maxPrice", "") });
    }
    if (filters.minRating) {
      active.push({ key: "minRating", label: "Rating", value: `${filters.minRating}★ & up`, onRemove: () => updateFilter("minRating", "") });
    }
    return active;
  }, [filters, categories, allSubcategories, brands]);

  // Sync internal state with initialFilters prop changes (bail out when unchanged to avoid render loops)
  useEffect(() => {
    setFilters((prev) => {
      const next: FilterState = {
        ...prev,
        categoryId: initialFilters.categoryId || "",
        subcategoryId: initialFilters.subcategoryId || "",
        brandId: initialFilters.brandId || "",
        minPrice: initialFilters.minPrice || "",
        maxPrice: initialFilters.maxPrice || "",
        minRating: initialFilters.minRating || "",
      };
      const unchanged = (Object.keys(next) as (keyof FilterState)[]).every(
        (key) => prev[key] === next[key]
      );
      return unchanged ? prev : next;
    });
  }, [initialFilters]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "categoryId") next.subcategoryId = "";
        return next;
      });
    },
    []
  );

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const handleCloseMobile = () => setMobileFilterOpen(false);

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
      </div>

      {/* Category Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Category</h3>
        <div className="space-y-1.5">
          {categories.map((cat: FilterOption) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                filters.categoryId === cat.id
                  ? "border-primarymain bg-primarymain"
                  : "border-gray-300 group-hover:border-gray-500"
              }`}>
                {filters.categoryId === cat.id && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <input
                type="radio"
                name="category"
                checked={filters.categoryId === cat.id}
                onChange={() => updateFilter("categoryId", cat.id)}
                className="sr-only"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory Filter */}
      {filters.categoryId && filteredSubcategories.length > 0 && (
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Subcategory</h3>
          <div className="space-y-1.5">
            {filteredSubcategories.map((sub: FilterOption) => (
              <label key={sub.id} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                  filters.subcategoryId === sub.id
                    ? "border-primarymain bg-primarymain"
                    : "border-gray-300 group-hover:border-gray-500"
                }`}>
                  {filters.subcategoryId === sub.id && <div className="w-1.5 h-1.5 bg-white" />}
                </div>
                <input
                  type="radio"
                  name="subcategory"
                  checked={filters.subcategoryId === sub.id}
                  onChange={() => updateFilter("subcategoryId", sub.id)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{sub.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brand Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Brand</h3>
        <div className="space-y-1.5">
          {brands.map((brand: FilterOption) => (
            <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                filters.brandId === brand.id
                  ? "border-primarymain bg-primarymain"
                  : "border-gray-300 group-hover:border-gray-500"
              }`}>
                {filters.brandId === brand.id && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <input
                type="radio"
                name="brand"
                checked={filters.brandId === brand.id}
                onChange={() => updateFilter("brandId", brand.id)}
                className="sr-only"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Price Range (Rs.)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-primarymain transition-colors"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-primarymain transition-colors"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Minimum Rating</h3>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                filters.minRating === rating.toString()
                  ? "border-primarymain bg-primarymain"
                  : "border-gray-300 group-hover:border-gray-500"
              }`}>
                {filters.minRating === rating.toString() && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating.toString()}
                onChange={() => updateFilter("minRating", rating.toString())}
                className="sr-only"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                {rating} ★ & up
              </span>
            </label>
          ))}
          {filters.minRating && (
            <button
              onClick={() => updateFilter("minRating", "")}
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors mt-1"
            >
              Clear rating
            </button>
          )}
        </div>
      </div>

      {/* Clear All Button at bottom (mobile overlay only; desktop uses Clear beside sort) */}
      {hasActiveFilters && (
        <div className="md:hidden border-t border-gray-100 pt-5">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={filter.onRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primarymain/10 text-primarymain text-sm rounded-full border border-primarymain/20 hover:bg-primarymain/20 transition-colors"
            >
              <Tag size={10} className="flex-shrink-0" />
              <span className="font-medium">{filter.value}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); filter.onRemove(); }}
                className="ml-1 p-0.5 hover:bg-primarymain/30 rounded-full"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X size={10} />
              </button>
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-full border border-red-200 hover:bg-red-100 transition-colors"
          >
            <X size={10} className="flex-shrink-0" />
            <span className="font-medium">Clear all</span>
          </button>
        </div>
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 hover:border-primarymain transition-colors"
      >
        <SlidersHorizontal size={14} />
        Filters
        {hasActiveFilters && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primarymain rounded-full">
            {activeFilters.length}
          </span>
        )}
      </button>

      {/* Desktop filter (no wrapper, used in sticky container) */}
      <div className="hidden md:block">
        {filterContent}
      </div>

      {/* Mobile filter overlay with slide animation */}
      <div className={cn("fixed inset-0 z-50 md:hidden transition-opacity duration-300", mobileFilterOpen ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div
          className="absolute inset-0 bg-black/30 transition-opacity duration-300"
          onClick={handleCloseMobile}
          style={{ opacity: mobileFilterOpen ? 1 : 0 }}
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-[70] w-80 max-w-full bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col border-r border-gray-100",
            mobileFilterOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-900">Filters</span>
              {hasActiveFilters && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primarymain rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </div>
            <button
              onClick={handleCloseMobile}
              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {filterContent}
          </div>
        </div>
      </div>
    </>
  );
}
