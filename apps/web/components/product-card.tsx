"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";

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

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const outOfStock = isOutOfStock(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
        opacity: 0,
      }}
    >
      <div className="relative aspect-square bg-zinc-100 overflow-hidden border-2 border-transparent group-hover:border-black transition-all duration-300">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full font-syne text-4xl font-bold text-zinc-200">
            {product.name.charAt(0)}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="font-space text-white text-xs font-bold px-4 py-2 border-2 border-white">
              OUT OF STOCK
            </span>
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-4 right-4 bg-yellow-400 text-black font-space text-xs font-bold px-3 py-1 rotate-3">
            FEATURED
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-syne font-bold text-lg line-clamp-2 group-hover:underline">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="font-space text-sm font-bold">{getProductPrice(product)}</p>
          {product.category && (
            <span className="font-space text-xs text-zinc-500 uppercase">
              {product.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
