"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import Rating from "@/components/rating";

interface ProductCardProps {
  product: Product;
  index?: number;
}

function getProductPrice(product: Product) {
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatPrice(minPrice);
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }
  return formatPrice(product.price);
}

function isOutOfStock(product: Product) {
  if (product.variants && product.variants.length > 0) {
    return product.variants.every((v) => v.stockQuantity <= 0);
  }
  return (product.stockQuantity ?? 0) <= 0;
}

function getDiscountPercent(product: Product): number | null {
  const comparePrice = product.compareAtPrice;
  const price = product.price ?? 0;
  if (comparePrice && comparePrice > price) {
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }
  return null;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const outOfStock = isOutOfStock(product);
  const discountPercent = getDiscountPercent(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden border border-gray-200 group-hover:border-primarymain transition-colors duration-200">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-200">
            {product.name.charAt(0)}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold tracking-widest px-4 py-1.5 border border-white">
              OUT OF STOCK
            </span>
          </div>
        )}
        {discountPercent && (
          <div className="absolute top-2 left-2 bg-primarymain text-white text-[10px] font-bold tracking-wider px-2 py-1 z-10">
            SAVE {discountPercent}%
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="font-medium text-[15px] leading-snug text-gray-900 line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">{getProductPrice(product)}</p>
          {product.category && (
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">
              {product.category.name}
            </span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <Rating
            rating={product.averageRating}
            size="sm"
            showValue
            reviewCount={product.reviewCount}
          />
        )}
      </div>
    </Link>
  );
}
