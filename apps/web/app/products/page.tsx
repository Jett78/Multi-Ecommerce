"use client";

import { useState, useCallback } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";
import ProductCard from "@/components/product-card";
import ProductFilter from "@/components/product-filter";

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });

  const { getAllPaginated } = useCrud<Product>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "public-products",
  });

  const { data: productsData, isLoading } = getAllPaginated({
    take: 50,
    skip: 0,
    status: "active",
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.subcategoryId && { subcategoryId: filters.subcategoryId }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.minPrice && { minPrice: parseInt(filters.minPrice) }),
    ...(filters.maxPrice && { maxPrice: parseInt(filters.maxPrice) }),
    ...(filters.minRating && { minRating: parseInt(filters.minRating) * 10 }),
  });

  const products = productsData?.items || [];

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400..800&display=swap');
        
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-space { font-family: 'Space Mono', monospace; }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Hero Header */}
      <div className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <h1 className="font-syne font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-4">
            SHOP<br />ALL
          </h1>
          <p className="font-space text-sm md:text-base text-zinc-400 max-w-md">
            {products.length} products · Curated collections · Free shipping over Rs. 5000
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-8">
          <ProductFilter onFilterChange={handleFilterChange} />

          {/* Products Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-zinc-200 mb-4" />
                    <div className="h-4 bg-zinc-200 mb-2" />
                    <div className="h-4 bg-zinc-200 w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-syne text-3xl font-bold text-zinc-300 mb-2">NO PRODUCTS FOUND</p>
                <p className="font-space text-sm text-zinc-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
