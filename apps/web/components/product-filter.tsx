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
}

const initialFilters: FilterState = {
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
};

export default function ProductFilter({ onFilterChange }: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
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

  const clearFilters = () => setFilters(initialFilters);

  return (
    <>
      {/* Mobile toggle button - rendered outside aside for flexible placement */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white text-black font-space text-xs font-bold"
      >
        <SlidersHorizontal size={16} />
        FILTER
      </button>

      <aside
        className={`${
          mobileFilterOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden"
        } md:block md:static md:w-72 flex-shrink-0 space-y-8`}
      >
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-zinc-100"
        >
          <X size={24} />
        </button>

        <div className="flex items-center justify-between">
          <h2 className="font-syne font-bold text-2xl">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="font-space text-xs font-bold text-zinc-500 hover:text-black underline"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="border-t border-zinc-200 pt-6">
          <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-4">Category</h3>
          <div className="space-y-2">
            {categories.map((cat: FilterOption) => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${filters.categoryId === cat.id ? "bg-black" : "bg-white"}`}>
                  {filters.categoryId === cat.id && <div className="w-2 h-2 bg-white" />}
                </div>
                <input
                  type="radio"
                  name="category"
                  checked={filters.categoryId === cat.id}
                  onChange={() => updateFilter("categoryId", cat.id)}
                  className="sr-only"
                />
                <span className="font-space text-sm group-hover:underline">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Subcategory Filter */}
        {filters.categoryId && filteredSubcategories.length > 0 && (
          <div className="border-t border-zinc-200 pt-6">
            <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-4">Subcategory</h3>
            <div className="space-y-2">
              {filteredSubcategories.map((sub: FilterOption) => (
                <label key={sub.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${filters.subcategoryId === sub.id ? "bg-black" : "bg-white"}`}>
                    {filters.subcategoryId === sub.id && <div className="w-2 h-2 bg-white" />}
                  </div>
                  <input
                    type="radio"
                    name="subcategory"
                    checked={filters.subcategoryId === sub.id}
                    onChange={() => updateFilter("subcategoryId", sub.id)}
                    className="sr-only"
                  />
                  <span className="font-space text-sm group-hover:underline">{sub.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Brand Filter */}
        <div className="border-t border-zinc-200 pt-6">
          <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-4">Brand</h3>
          <div className="space-y-2">
            {brands.map((brand: FilterOption) => (
              <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${filters.brandId === brand.id ? "bg-black" : "bg-white"}`}>
                  {filters.brandId === brand.id && <div className="w-2 h-2 bg-white" />}
                </div>
                <input
                  type="radio"
                  name="brand"
                  checked={filters.brandId === brand.id}
                  onChange={() => updateFilter("brandId", brand.id)}
                  className="sr-only"
                />
                <span className="font-space text-sm group-hover:underline">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="border-t border-zinc-200 pt-6">
          <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-4">Price Range (Rs.)</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              className="w-full px-3 py-2 border-2 border-black font-space text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="w-full px-3 py-2 border-2 border-black font-space text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div className="border-t border-zinc-200 pt-6">
          <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-4">Minimum Rating</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${filters.minRating === rating.toString() ? "bg-black" : "bg-white"}`}>
                  {filters.minRating === rating.toString() && <div className="w-2 h-2 bg-white" />}
                </div>
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === rating.toString()}
                  onChange={() => updateFilter("minRating", rating.toString())}
                  className="sr-only"
                />
                <span className="font-space text-sm group-hover:underline">
                  {rating} ★ & up
                </span>
              </label>
            ))}
            {filters.minRating && (
              <button
                onClick={() => updateFilter("minRating", "")}
                className="font-space text-xs text-zinc-500 hover:text-black underline mt-2"
              >
                Clear rating
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
