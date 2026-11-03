"use client";

import { useState, useMemo } from "react";
import { X, Plus, Minus, Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/product";

interface VariantSelectionModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
}

export function VariantSelectionModal({
  product,
  onClose,
  onAddToCart,
}: VariantSelectionModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0] || ({} as ProductVariant)
  );
  const [quantity, setQuantity] = useState(1);

  const attributeGroups: Record<string, Set<string>> = useMemo(() => {
    if (!product.variants) return {};
    
    return product.variants.reduce((acc, variant) => {
      variant.attributes?.forEach((attr) => {
        if (!acc[attr.attributeName]) {
          acc[attr.attributeName] = new Set();
        }
        acc[attr.attributeName]?.add(attr.attributeValue);
      });
      return acc;
    }, {} as Record<string, Set<string>>);
  }, [product.variants]);

  const currentStock = selectedVariant?.stockQuantity || 0;
  const isInStock = currentStock > 0;
  const maxQuantity = Math.min(currentStock, 99);

  const handleSelectVariant = (attributeName: string, attributeValue: string) => {
    const variant = product.variants?.find((v) =>
      v.attributes?.some(
        (a) => a.attributeName === attributeName && a.attributeValue === attributeValue
      )
    );

    if (variant) {
      setSelectedVariant(variant);
      setQuantity(Math.min(quantity, variant.stockQuantity));
    }
  };

  const handleAddToCart = () => {
    if (!isInStock || !selectedVariant) return;
    onAddToCart(selectedVariant, quantity);
  };

  const totalPrice = (selectedVariant?.price || 0) * quantity;
  const image = selectedVariant?.images?.[0] || product.images?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 pr-8">{product.name}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-6">
            <div className="w-48 h-48 bg-slate-100 rounded-lg flex-shrink-0 relative overflow-hidden">
              {image ? (
                <Image
                  src={image.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="size-16 text-slate-300" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="space-y-4">
                {selectedVariant?.attributes && selectedVariant.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant.attributes.map((attr) => (
                      <span
                        key={attr.id}
                        className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium"
                      >
                        {attr.attributeName}: <span className="font-bold">{attr.attributeValue}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-3xl font-bold text-primary">
                    Rs. {selectedVariant?.price.toLocaleString()}
                  </p>
                  {selectedVariant?.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                    <p className="text-sm text-slate-500 line-through">
                      Rs. {selectedVariant.compareAtPrice.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Stock:</span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      currentStock === 0
                        ? "text-red-600"
                        : currentStock <= 5
                        ? "text-orange-600"
                        : "text-green-600"
                    )}
                  >
                    {currentStock === 0 ? "Out of Stock" : `${currentStock} available`}
                  </span>
                </div>

                {selectedVariant?.sku && (
                  <p className="text-xs text-slate-500">SKU: {selectedVariant.sku}</p>
                )}
              </div>
            </div>
          </div>

          {Object.keys(attributeGroups).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {Object.entries(attributeGroups).map(([attrName, values]) => (
                <div key={attrName}>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                    {attrName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(values).map((value) => {
                      const variant = product.variants?.find((v) =>
                        v.attributes?.some(
                          (a) => a.attributeName === attrName && a.attributeValue === value
                        )
                      );
                      const isSelected =
                        selectedVariant?.attributes?.some(
                          (a) => a.attributeName === attrName && a.attributeValue === value
                        ) || false;
                      const isAvailable = variant && variant.stockQuantity > 0;

                      return (
                        <button
                          key={value}
                          onClick={() => handleSelectVariant(attrName, value)}
                          disabled={!isAvailable}
                          className={cn(
                            "px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all min-w-[80px]",
                            isSelected
                              ? "border-primary bg-primary text-white shadow-md"
                              : isAvailable
                              ? "border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary hover:shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isInStock && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-slate-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-3 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="size-5" />
                  </button>
                  <span className="px-6 py-3 text-lg font-bold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="px-4 py-3 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
                <span className="text-sm text-slate-500">
                  Max: {maxQuantity}
                </span>
              </div>
            </div>
          )}

          {!isInStock && (
            <div className="pt-4 border-t border-slate-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-semibold">This variant is currently out of stock</p>
                <p className="text-red-600 text-sm mt-1">Please select a different option</p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-slate-700">Total:</span>
            <span className="font-bold text-2xl text-primary">
              Rs. {totalPrice.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-3 px-4 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
