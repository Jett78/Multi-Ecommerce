"use client";

import { useState, useEffect, useCallback } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { X, SlidersHorizontal } from "lucide-react";

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

  const { data: categoriesData } = getCategories({ take: 100, skip: 0 });
  const { data: subcategoriesData } = getSubcategories({ take: 100, skip: 0 });
  const { data: brandsData } = getBrands({ take: 100, skip: 0 });

  const categories = categoriesData || [];
  const allSubcategories = subcategoriesData || [];
  const brands = brandsData || [];

  const filteredSubcategories = filters.categoryId
    ? allSubcategories.filter((sub: FilterOption & { categoryId: string }) => sub.categoryId === filters.categoryId)
    : allSubcategories;

  const hasActiveFilters =
    filters.categoryId || filters.subcategoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.minRating;

  // Sync internal state with initialFilters prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId: initialFilters.categoryId || "",
      subcategoryId: initialFilters.subcategoryId || "",
      brandId: initialFilters.brandId || "",
      minPrice: initialFilters.minPrice || "",
      maxPrice: initialFilters.maxPrice || "",
      minRating: initialFilters.minRating || "",
    }));
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

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
          >
            Clear all
          </button>
        )}
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
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 hover:border-primarymain transition-colors"
      >
        <SlidersHorizontal size={14} />
        Filters
      </button>

      {/* Desktop filter (no wrapper, used in sticky container) */}
      <div className="hidden md:block">
        {filterContent}
      </div>

      {/* Mobile filter overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-full bg-white p-6 overflow-y-auto">
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
