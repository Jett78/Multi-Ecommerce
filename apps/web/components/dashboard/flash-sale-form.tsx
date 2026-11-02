"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/primary-button";
import FileUpload from "@/components/ui/file-upload";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateFlashSales } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { showSuccess, showError } from "@/lib/toast-helper";
import { formatPrice, generateSlug } from "@/lib/utils";
import { X, Plus, Search, Zap } from "lucide-react";
import type { FlashSale } from "@/types/flash-sale";
import type { Product } from "@/types/product";

const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

interface SaleProduct {
  variantId: string;
  productName: string;
  variantSku?: string;
  originalPrice: number;
  salePrice: number;
  maxQuantity?: number;
}

export default function FlashSaleForm({ flashSale }: { flashSale?: FlashSale }) {
  const router = useRouter();
  const isEditing = !!flashSale;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.FLASH_SALE,
    queryKey: "flash-sales",
    isAuthenticated: true,
  });

  const { values, errors, handleChange, setField } = useForm({
    name: flashSale?.name || "",
    slug: flashSale?.slug || "",
    description: flashSale?.description || "",
    startsAt: flashSale?.startsAt ? new Date(flashSale.startsAt).toISOString().slice(0, 16) : "",
    endsAt: flashSale?.endsAt ? new Date(flashSale.endsAt).toISOString().slice(0, 16) : "",
    isActive: flashSale?.isActive ?? true,
    imageUrl: flashSale?.imageUrl || "",
  });

  const [saleProducts, setSaleProducts] = React.useState<SaleProduct[]>(
    flashSale?.products?.map((p) => ({
      variantId: p.variantId,
      productName: p.productName,
      variantSku: p.variantSku,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      maxQuantity: p.maxQuantity,
    })) || []
  );

  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const debouncedSearch = useDebounce(productSearch, 300);

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Flash Sale",
    redirectPath: "/dashboard/flash-sales",
    entityId: flashSale?.id,
    revalidateAction: async () => {
      await revalidateFlashSales();
    },
  });

  const handleSearchProducts = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await apiClient<any>(
        `${API_ROUTES.PRODUCT}?take=10&skip=0&search=${encodeURIComponent(query)}`
      );
      setSearchResults(response?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    handleSearchProducts(debouncedSearch);
  }, [debouncedSearch, handleSearchProducts]);

  React.useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await apiClient<any>(
          `${API_ROUTES.PRODUCT}?take=10&skip=0`
        );
        console.log("Latest products response:", response);
        setLatestProducts(response?.data || []);
      } catch (err) {
        console.error("Error fetching latest products:", err);
        setLatestProducts([]);
      }
    };
    fetchLatestProducts();
  }, []);

  const addProduct = (product: Product) => {
    const variant = product.variants?.[0];
    if (!variant) return;

    if (saleProducts.some((p) => p.variantId === variant.id)) {
      showError(`"${product.name}" is already in the sale`);
      return;
    }

    setSaleProducts((prev) => [
      ...prev,
      {
        variantId: variant.id,
        productName: product.name,
        variantSku: variant.sku,
        originalPrice: variant.price,
        salePrice: Math.round(variant.price * 0.8),
        maxQuantity: undefined,
      },
    ]);
  };

  const removeProduct = (variantId: string) => {
    setSaleProducts((prev) => prev.filter((p) => p.variantId !== variantId));
  };

  const updateProductSalePrice = (variantId: string, salePrice: number) => {
    setSaleProducts((prev) =>
      prev.map((p) => (p.variantId === variantId ? { ...p, salePrice } : p))
    );
  };

  const updateProductMaxQuantity = (variantId: string, maxQuantity: number | undefined) => {
    setSaleProducts((prev) =>
      prev.map((p) => (p.variantId === variantId ? { ...p, maxQuantity } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      name: values.name,
      slug: values.slug || generateSlug(values.name),
      description: values.description || undefined,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      isActive: values.isActive,
      imageUrl: values.imageUrl || undefined,
      products: saleProducts.map((p) => ({
        variantId: p.variantId,
        salePrice: p.salePrice,
        originalPrice: p.originalPrice,
        maxQuantity: p.maxQuantity || undefined,
      })),
    };

    if (isEditing && flashSale) {
      put.mutate({ id: flashSale.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      {isPending && (
        <SubmittingLoader status={isEditing ? "Updating flash sale" : "Creating flash sale"} />
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
          <Zap className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Flash Sale" : "New Flash Sale"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditing ? "Update flash sale details" : "Create a new time-limited flash sale"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Basic Info</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name *</label>
              <input
                type="text"
                name="name"
                className={inputClass}
                value={values.name}
                onChange={(e) => {
                  handleChange(e);
                  if (!isEditing) {
                    setField("slug", generateSlug(e.target.value));
                  }
                }}
                placeholder="e.g., Mega Flash Sale"
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                className={`${inputClass} min-h-[80px]`}
                value={values.description}
                onChange={handleChange}
                placeholder="Optional description for this flash sale"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Schedule</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Starts At *</label>
                <input
                  type="datetime-local"
                  name="startsAt"
                  className={inputClass}
                  value={values.startsAt}
                  onChange={handleChange}
                />
                {errors.startsAt && <p className="text-xs text-rose-600">{errors.startsAt}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ends At *</label>
                <input
                  type="datetime-local"
                  name="endsAt"
                  className={inputClass}
                  value={values.endsAt}
                  onChange={handleChange}
                />
                {errors.endsAt && <p className="text-xs text-rose-600">{errors.endsAt}</p>}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Products ({saleProducts.length})
            </h2>

            {/* Product Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-slate-300 border-t-primarymain rounded-full animate-spin" />
                </div>
              )}
              <input
                type="text"
                className={`${inputClass} pl-10 ${isSearching ? "pr-10" : ""}`}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
              />
              {hasSearched && !isSearching && searchResults.length === 0 && productSearch.length >= 2 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-6 text-center">
                  <p className="text-sm text-slate-500">No products found for &quot;{productSearch}&quot;</p>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => {
                    const productImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                          {productImage?.url ? (
                            <img src={productImage.url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-300">
                              {product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            {product.variants?.[0]?.price ? formatPrice(product.variants[0].price) : "No price"}
                            {product.variants?.[0]?.sku && ` · SKU: ${product.variants[0].sku}`}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products Table */}
            {saleProducts.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2">
                        Product
                      </th>
                      <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2">
                        Original
                      </th>
                      <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2">
                        Sale Price
                      </th>
                      <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2">
                        Discount
                      </th>
                      <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2">
                        Max Qty
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {saleProducts.map((item) => {
                      const discount = item.originalPrice > 0
                        ? Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100)
                        : 0;
                      return (
                        <tr key={item.variantId} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                            {item.variantSku && (
                              <p className="text-xs text-slate-500">SKU: {item.variantSku}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatPrice(item.originalPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              className="w-24 text-right h-8 rounded border border-slate-200 px-2 text-sm"
                              value={item.salePrice}
                              onChange={(e) =>
                                updateProductSalePrice(item.variantId, parseInt(e.target.value) || 0)
                              }
                              min={0}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-bold ${discount >= 50 ? "text-red-600" : "text-emerald-600"}`}>
                              {discount}% OFF
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              className="w-20 text-right h-8 rounded border border-slate-200 px-2 text-sm"
                              value={item.maxQuantity ?? ""}
                              onChange={(e) =>
                                updateProductMaxQuantity(
                                  item.variantId,
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              min={1}
                              placeholder="Unlimited"
                            />
                          </td>
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => removeProduct(item.variantId)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products added yet. Search above or select from latest products below.</p>
                </div>
                {latestProducts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Latest Products</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {latestProducts.map((product) => {
                        const productImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                              {productImage?.url ? (
                                <img src={productImage.url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-300">
                                  {product.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                              <p className="text-xs text-slate-500">
                                {product.variants?.[0]?.price ? formatPrice(product.variants[0].price) : "No price"}
                                {product.variants?.[0]?.sku && ` · SKU: ${product.variants[0].sku}`}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Settings</h2>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Active</label>
              <button
                type="button"
                onClick={() => setField("isActive", !values.isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  values.isActive ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    values.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Banner Image</label>
              <FileUpload
                onSuccess={(file) => setField("imageUrl", file.url)}
                defaultImage={values.imageUrl}
                folder="flash-sales"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryButton
              type="submit"
              text={isEditing ? "Update Flash Sale" : "Create Flash Sale"}
              disabled={isPending}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
