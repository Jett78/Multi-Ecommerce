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
    }, quantity);

    dispatchOpenCart();
    showSuccess("Added to cart");
  };

  return (
    <div className="space-y-8">
      {/* Title & Category */}
      <div>
        {product.category && (
          <span className="inline-block font-space text-xs font-bold uppercase tracking-wider bg-yellow-400 text-black px-3 py-1 mb-4">
            {product.category.name}
          </span>
        )}
        <h1 className="font-syne font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight mb-4">
          {product.name}
        </h1>
        {product.brand && (
          <p className="font-space text-sm text-zinc-500">
            BY {product.brand.name.toUpperCase()}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="pb-8 border-b-2 border-zinc-200">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="font-syne text-4xl font-bold">
            {formatPrice(currentPrice)}
          </span>
          {currentComparePrice && (
            <span className="font-space text-lg text-zinc-400 line-through">
              {formatPrice(currentComparePrice)}
            </span>
          )}
          {currentComparePrice && currentComparePrice > currentPrice && (
            <span className="font-space text-sm font-bold bg-red-500 text-white px-2 py-1">
              SAVE {Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)}%
            </span>
          )}
        </div>

        {selectedVariant && selectedVariant.attributes && selectedVariant.attributes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedVariant.attributes.map((attr) => (
              <span key={attr.id} className="font-space text-xs bg-zinc-100 px-2 py-1">
                {attr.attributeName}: <span className="font-bold">{attr.attributeValue}</span>
              </span>
            ))}
          </div>
        )}

        {hasVariants && Object.keys(attributeGroups).length > 0 && (
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            {Object.entries(attributeGroups).map(([attrName, values]) => (
              <div key={attrName}>
                <h3 className="font-space text-xs font-bold uppercase tracking-wider mb-2">
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
                        className={`px-4 py-2 font-space text-sm border-2 transition-all ${
                          isSelected
                            ? "border-black bg-black text-white"
                            : isAvailable
                            ? "border-black bg-white text-black hover:bg-black hover:text-white"
                            : "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
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
                <span className="font-space font-bold">STOCK:</span>
                <span className={`font-space ${currentStock <= 5 ? "text-red-600" : "text-green-600"}`}>
                  {currentStock} AVAILABLE
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Info (for non-variant products) */}
      {!hasVariants && (
        <div className="flex items-center gap-3 pb-8 border-b-2 border-zinc-200">
          {isInStock ? (
            <>
              <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                <Check size={16} className="text-white" />
              </div>
              <span className="font-space text-sm">
                <span className="font-bold">IN STOCK</span> · {currentStock} available
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                <X size={16} className="text-white" />
              </div>
              <span className="font-space text-sm font-bold">OUT OF STOCK</span>
            </>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      {isInStock && (
        <div className="flex items-center gap-4">
          <span className="font-space text-sm font-bold text-zinc-600">QUANTITY:</span>
          <div className="flex items-center border-2 border-zinc-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 text-lg font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-space text-sm font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              className="px-4 py-2 text-lg font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              +
            </button>
          </div>
          <span className="font-space text-xs text-zinc-400">
            {currentStock} available
          </span>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isInStock}
        className={`w-full py-4 font-space text-sm font-bold transition-all ${
          isInStock
            ? "bg-black text-white hover:bg-zinc-800 active:scale-95"
            : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
        }`}
      >
        {isInStock ? (
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag size={18} />
            ADD TO CART
          </span>
        ) : (
          "OUT OF STOCK"
        )}
      </button>

      {/* Description */}
      {product.description && (
        <div className="space-y-4 pt-8 border-t-2 border-zinc-200">
          <h2 className="font-syne font-bold text-2xl">ABOUT</h2>
          <div
            className="font-space text-sm leading-relaxed text-zinc-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Product Meta */}
      <div className="space-y-2 pt-8 border-t-2 border-zinc-200">
        {product.sku && (
          <div className="flex gap-4">
            <span className="font-space text-xs font-bold text-zinc-400 uppercase w-24">SKU:</span>
            <span className="font-space text-xs">{product.sku}</span>
          </div>
        )}
        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-4">
            <span className="font-space text-xs font-bold text-zinc-400 uppercase w-24">TAGS:</span>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-space text-xs bg-zinc-100 px-2 py-1 uppercase"
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
