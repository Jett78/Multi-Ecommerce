"use client";

import * as React from "react";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/product";
import { ShoppingBag, Check, X } from "lucide-react";
import { dispatchOpenCart } from "@/components/cart/cart-icon";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";

interface ProductInfoProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
}

export default function ProductInfo({ product, selectedVariant, onSelectVariant }: ProductInfoProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  const [quantity, setQuantity] = React.useState(1);

  const currentPrice = selectedVariant?.price ?? product.price ?? 0;
  const currentComparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const currentStock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const isInStock = currentStock > 0;
  const currentVariantId = selectedVariant?.id || product.variants?.[0]?.id;

  const attributeGroups: Record<string, Set<string>> = hasVariants
    ? product.variants!.reduce((acc, variant) => {
        variant.attributes?.forEach((attr) => {
          if (!acc[attr.attributeName]) {
            acc[attr.attributeName] = new Set();
          }
          acc[attr.attributeName]?.add(attr.attributeValue);
        });
        return acc;
      }, {} as Record<string, Set<string>>)
    : {};

  const handleAddToCart = () => {
    if (!isInStock) return;
    if (!currentVariantId) {
      showError("This product is not available for purchase");
      return;
    }

    const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const addQuantity = Math.min(quantity, currentStock);

    useCartStore.getState().addItem({
      variantId: currentVariantId,
      priceAtAdd: currentPrice,
      productName: product.name,
      productSlug: product.slug,
      variantSku: selectedVariant?.sku ?? null,
      stockQuantity: currentStock,
      allowBackorder: selectedVariant?.allowBackorder ?? product.allowBackorder ?? false,
      imageUrl: primaryImage?.url,
      productId: product.id,
      attributes: selectedVariant?.attributes?.map((a) => ({ attributeName: a.attributeName, attributeValue: a.attributeValue })),
    }, addQuantity);

    dispatchOpenCart();
    showSuccess("Added to cart");
  };

  return (
    <div className="space-y-6">
      {/* Title & Category */}
      <div>
        {product.category && (
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            {product.category.name}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900 leading-tight mb-3">
          {product.name}
        </h1>
        {product.brand && (
          <p className="text-sm text-gray-400">
            by {product.brand.name}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(currentPrice)}
          </span>
          {currentComparePrice && (
            <span className="text-base text-gray-400 line-through">
              {formatPrice(currentComparePrice)}
            </span>
          )}
          {currentComparePrice && currentComparePrice > currentPrice && (
            <span className="text-[11px] font-bold bg-primarymain text-white px-2 py-0.5 tracking-wide">
              SAVE {Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
            </span>
          )}
        </div>

        {selectedVariant && selectedVariant.attributes && selectedVariant.attributes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedVariant.attributes.map((attr) => (
              <span key={attr.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1">
                {attr.attributeName}: <span className="font-semibold">{attr.attributeValue}</span>
              </span>
            ))}
          </div>
        )}

        {hasVariants && Object.keys(attributeGroups).length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {Object.entries(attributeGroups).map(([attrName, values]) => (
              <div key={attrName}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {attrName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(values).map((value) => {
                    const variant = product.variants!.find((v) =>
                      v.attributes?.some(
                        (a) => a.attributeName === attrName && a.attributeValue === value
                      )
                    );
                    const isSelected = selectedVariant?.id === variant?.id;
                    const isAvailable = variant && variant.stockQuantity > 0;

                    return (
                      <button
                        key={value}
                        onClick={() => variant && onSelectVariant(variant)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 text-sm border transition-all ${
                          isSelected
                            ? "border-primarymain bg-primarymain text-white"
                            : isAvailable
                            ? "border-gray-300 bg-white text-gray-700 hover:border-primarymain hover:text-primarymain"
                            : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedVariant && (
              <div className="flex items-center gap-2 text-sm pt-2">
                <span className="font-semibold text-gray-500">Stock:</span>
                <span className={`font-medium ${currentStock <= 5 ? "text-red-600" : "text-green-600"}`}>
                  {currentStock} available
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Info (for non-variant products) */}
      {!hasVariants && (
        <div className="flex items-center gap-3 pb-6 border-b border-gray-200">
          {isInStock ? (
            <>
              <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <Check size={12} className="text-white" />
              </div>
              <span className="text-sm">
                <span className="font-semibold">In stock</span> · {currentStock} available
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
                <X size={12} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-red-600">Out of stock</span>
            </>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      {isInStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Quantity</span>
          <div className="flex items-center border border-gray-300">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              -
            </button>
            <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {currentStock} available
          </span>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isInStock || quantity > currentStock}
        className={`w-full py-4 text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
          isInStock && quantity <= currentStock
            ? "bg-primarymain text-white hover:bg-primarymain/90"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isInStock ? (
          <>
            <ShoppingBag size={16} />
            ADD TO CART
          </>
        ) : (
          "OUT OF STOCK"
        )}
      </button>

      {/* Description */}
      {product.description && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <h2 className="text-base font-bold text-gray-900">About this product</h2>
          <div
            className="text-sm leading-relaxed text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Product Meta */}
      <div className="space-y-2 pt-6 border-t border-gray-200">
        {product.sku && (
          <div className="flex gap-4">
            <span className="text-xs font-medium text-gray-400 uppercase w-20">SKU</span>
            <span className="text-xs text-gray-600">{product.sku}</span>
          </div>
        )}
        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-4">
            <span className="text-xs font-medium text-gray-400 uppercase w-20">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
