"use client";

import { useState, useCallback, useEffect } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import ProductCard from "@/components/product-card";
import ProductFilter from "@/components/product-filter";
import { getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });
  const [page, setPage] = useState(1);
  const [flashSaleProducts, setFlashSaleProducts] = useState<ActiveFlashSaleProduct[]>([]);
  const take = 20;

  const { getAllPaginated } = useCrud<Product>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "public-products",
  });

  const { data: productsData, isLoading } = getAllPaginated({
    take,
    skip: (page - 1) * take,
    status: "active",
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.subcategoryId && { subcategoryId: filters.subcategoryId }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.minPrice && { minPrice: parseInt(filters.minPrice) }),
    ...(filters.maxPrice && { maxPrice: parseInt(filters.maxPrice) }),
    ...(filters.minRating && { minRating: parseInt(filters.minRating) * 10 }),
  });

  const products = productsData?.items || [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / take);

  useEffect(() => {
    getActiveFlashSaleProducts().then(setFlashSaleProducts);
  }, []);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-primarymain text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
            Shop All
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-md">
            {total} products · Curated collections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Sticky Filter Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilter onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 mb-3" />
                    <div className="h-3 bg-gray-100 mb-2 w-3/4" />
                    <div className="h-3 bg-gray-100 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl font-bold text-gray-300 mb-1">No products found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product, index) => {
                    const productVariantIds = product.variants?.map((v: { id: string }) => v.id) || [];
                    const flashSale = flashSaleProducts.find((fp) =>
                      productVariantIds.includes(fp.variantId)
                    ) || null;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        flashSalePrice={flashSale?.salePrice}
                        flashSaleOriginalPrice={flashSale?.originalPrice}
                        flashSaleName={flashSale?.flashSaleName}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (Math.abs(p - page) <= 1) return true;
                        return false;
                      })
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        typeof p === "string" ? (
                          <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-300 text-sm">
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors ${
                              page === p
                                ? "bg-primarymain text-white"
                                : "border border-gray-200 text-gray-600 hover:border-primarymain"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
