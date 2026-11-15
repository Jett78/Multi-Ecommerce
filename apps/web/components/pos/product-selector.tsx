"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { useDebounce } from "@/hooks/useDebounce";
import { API_ROUTES } from "@/config/api-routes";
import { Product, ProductVariant } from "@/types/product";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { VariantSelectionModal } from "./variant-selection-modal";

const PAGE_SIZE = 20;

export function ProductSelector() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);

  const debouncedSearch = useDebounce(search, 300);

  const { getAllPaginated: getProducts } = useCrud<Product>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "products-pos",
  });

  const { getAll: getCategories } = useCrud({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "categories",
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  const { data: productsData, isLoading: productsLoading } = getProducts({
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    status: "active",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory } : {}),
  });
  const { data: categoriesData } = getCategories({ take: 100, skip: 0, isActive: true });

  const products = (productsData?.items || []) as Product[];
  const total = productsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categories = (Array.isArray(categoriesData) ? categoriesData : []) as any[];

  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (product: Product) => {
    const hasMultipleVariants = product.variants && product.variants.length > 1;

    if (hasMultipleVariants) {
      setSelectedProductForVariants(product);
      setShowVariantModal(true);
      return;
    }

    const variant = product.variants?.[0];
    if (!variant) return;

    const firstImage = variant.images?.[0] || product.images?.[0];

    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: variant.attributes?.map(a => a.attributeValue).join(" / ") || null,
      priceAtAdd: variant.price,
      imageUrl: firstImage?.url,
      stockQuantity: variant.stockQuantity,
      variantSku: variant.sku,
      allowBackorder: variant.allowBackorder,
      categoryId: product.categoryId,
      brandId: product.brandId,
      attributes: variant.attributes || [],
    }, 1);

    showSuccess(`${product.name} added to cart`);
  };

  const handleAddVariantToCart = (variant: ProductVariant, quantity: number) => {
    if (!selectedProductForVariants) return;

    const firstImage = variant.images?.[0] || selectedProductForVariants.images?.[0];

    addItem({
      variantId: variant.id,
      productId: selectedProductForVariants.id,
      productName: selectedProductForVariants.name,
      productSlug: selectedProductForVariants.slug,
      variantName: variant.attributes?.map(a => a.attributeValue).join(" / ") || null,
      priceAtAdd: variant.price,
      imageUrl: firstImage?.url,
      stockQuantity: variant.stockQuantity,
      variantSku: variant.sku,
      allowBackorder: variant.allowBackorder,
      categoryId: selectedProductForVariants.categoryId,
      brandId: selectedProductForVariants.brandId,
      attributes: variant.attributes || [],
    }, quantity);

    showSuccess(`${selectedProductForVariants.name} added to cart`);
    setShowVariantModal(false);
    setSelectedProductForVariants(null);
  };

  const handleBarcodeLookup = async (code: string) => {
    if (!code || isScanningRef.current) return;
    isScanningRef.current = true;
    try {
      const res = await apiClient<{ success: boolean; data?: Product }>(
        `${API_ROUTES.PRODUCT_BARCODE}/${encodeURIComponent(code)}`
      );
      if (res?.data) {
        handleAddToCart(res.data);
        setSearch("");
      } else {
        showError(`No product found for "${code}"`);
      }
    } catch {
      showError(`No product found for "${code}"`);
    } finally {
      isScanningRef.current = false;
      searchInputRef.current?.focus();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleBarcodeLookup(search.trim());
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search or scan barcode, then press Enter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          autoFocus
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {productsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center text-slate-400">
              <Package className="size-16 mx-auto mb-3" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          products.map((product) => {
          const variant = product.variants?.[0];
          const image = variant?.images?.[0] || product.images?.[0];
          const stock = variant?.stockQuantity || 0;
          const isLowStock = stock <= (variant?.lowStockThreshold || 5);
          const hasMultipleVariants = product.variants && product.variants.length > 1;
          const price = variant?.price ?? product.price;
          const compareAt =
            variant?.compareAtPrice && variant.compareAtPrice > (variant.price ?? 0)
              ? variant.compareAtPrice
              : product.compareAtPrice && product.compareAtPrice > (product.price ?? 0)
                ? product.compareAtPrice
                : null;
          const discountPercent =
            compareAt && price
              ? Math.round(((compareAt - price) / compareAt) * 100)
              : null;
          const sku = variant?.sku || product.sku;

          return (
            <button
              key={product.id}
              onClick={() => handleAddToCart(product)}
              disabled={stock === 0}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primarymain transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left relative"
            >
              {hasMultipleVariants && (
                <div className="absolute top-2 right-2 bg-primarymain text-white text-[10px] font-bold px-2 py-1 rounded z-10">
                  {product.variants?.length} options
                </div>
              )}
              {discountPercent && (
                <div className="absolute top-2 left-2 bg-primarymain text-white text-[10px] font-bold tracking-wider px-2 py-1 z-10">
                  SAVE {discountPercent}%
                </div>
              )}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {image ? (
                  <Image
                    src={image.url}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="size-12 text-gray-200" />
                  </div>
                )}
                {stock === 0 && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold tracking-widest px-3 py-1.5 border border-white">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>
              <div className="px-3 py-2.5">
                <h3 className="font-medium text-[13px] leading-snug text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Rs. {price?.toLocaleString()}
                  </p>
                  {compareAt && (
                    <p className="text-xs text-gray-400 line-through">
                      Rs. {compareAt.toLocaleString()}
                    </p>
                  )}
                </div>
                {sku && (
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                    SKU: {sku}
                  </p>
                )}
                <p className={cn(
                  "text-xs mt-1",
                  isLowStock ? "text-orange-600 font-medium" : "text-slate-500"
                )}>
                  Stock: {stock}
                </p>
              </div>
            </button>
          );
        })
        )}
      </div>

      {!productsLoading && total > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            <span className="text-sm text-slate-600 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {showVariantModal && selectedProductForVariants && (
        <VariantSelectionModal
          product={selectedProductForVariants}
          onClose={() => {
            setShowVariantModal(false);
            setSelectedProductForVariants(null);
          }}
          onAddToCart={handleAddVariantToCart}
        />
      )}
    </div>
  );
}
