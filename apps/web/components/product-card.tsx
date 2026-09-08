"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import { formatPrice } from "@/lib/utils";
import Rating from "@/components/rating";
import WishlistButton from "@/components/wishlist/wishlist-button";

interface ProductCardProps {
  product?: Product;
  index?: number;
  flashSalePrice?: number;
  flashSaleOriginalPrice?: number;
  flashSaleName?: string;
  activeFlashSaleProduct?: ActiveFlashSaleProduct;
}

function getCheapestVariant(product: Product) {
  if (product.variants && product.variants.length > 0) {
    const inStockVariants = product.variants.filter((v) => v.stockQuantity > 0);
    if (inStockVariants.length > 0) {
      return inStockVariants.reduce((cheapest, current) =>
        current.price < cheapest.price ? current : cheapest
      );
    }
    return product.variants.reduce((cheapest, current) =>
      current.price < cheapest.price ? current : cheapest
    );
  }
  return null;
}

function getProductPrice(product: Product) {
  const variant = getCheapestVariant(product);
  if (variant) {
    return formatPrice(variant.price);
  }
  return formatPrice(product.price);
}

function getCompareAtPrice(product: Product): string | null {
  const variant = getCheapestVariant(product);
  if (variant?.compareAtPrice && variant.compareAtPrice > variant.price) {
    return formatPrice(variant.compareAtPrice);
  }
  const comparePrice = product.compareAtPrice;
  if (comparePrice && comparePrice > (product.price ?? 0)) {
    return formatPrice(comparePrice);
  }
  return null;
}

function isOutOfStock(product: Product) {
  if (product.variants && product.variants.length > 0) {
    return product.variants.every((v) => v.stockQuantity <= 0);
  }
  return (product.stockQuantity ?? 0) <= 0;
}

function getDiscountPercent(product: Product): number | null {
  const variant = getCheapestVariant(product);
  if (variant?.compareAtPrice && variant.price) {
    if (variant.compareAtPrice > variant.price) {
      return Math.round(
        ((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100
      );
    }
    return null;
  }
  const comparePrice = product.compareAtPrice;
  const price = product.price ?? 0;
  if (comparePrice && comparePrice > price) {
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }
  return null;
}

export default function ProductCard({
  product,
  index = 0,
  flashSalePrice,
  flashSaleOriginalPrice,
  flashSaleName,
  activeFlashSaleProduct,
}: ProductCardProps) {
  if (!product) return null;

  const primaryImage = activeFlashSaleProduct?.imageUrl
    ? { url: activeFlashSaleProduct.imageUrl, isPrimary: true }
    : product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const outOfStock = isOutOfStock(product);
  const discountPercent = getDiscountPercent(product);
  const compareAtPrice = getCompareAtPrice(product);

  const salePrice = activeFlashSaleProduct?.salePrice ?? flashSalePrice;
  const originalPrice = activeFlashSaleProduct?.originalPrice ?? flashSaleOriginalPrice;
  const hasFlashSale = salePrice != null && originalPrice != null && salePrice < originalPrice;
  const flashSaleDiscount = hasFlashSale
    ? Math.round(((originalPrice! - salePrice!) / originalPrice!) * 100)
    : null;

  const displayName = activeFlashSaleProduct?.productName ?? product.name;
  const displaySlug = activeFlashSaleProduct?.productSlug ?? product.slug;

  return (
    <Link
      href={`/products/${displaySlug}`}
      className="group relative"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden border border-gray-200 group-hover:border-primarymain transition-colors duration-200">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={displayName}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-200">
            {displayName.charAt(0)}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold tracking-widest px-4 py-1.5 border border-white">
              OUT OF STOCK
            </span>
          </div>
        )}
        {hasFlashSale && flashSaleDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 z-10 flex items-center gap-1">
            <span>FLASH SALE</span>
            <span>{flashSaleDiscount}% OFF</span>
          </div>
        )}
        {!hasFlashSale && discountPercent && (
          <div className="absolute top-2 left-2 bg-primarymain text-white text-[10px] font-bold tracking-wider px-2 py-1 z-10">
            SAVE {discountPercent}%
          </div>
        )}
        {product && (
          <div className="absolute top-2 right-2 z-10">
            <WishlistButton product={product} size="sm" />
          </div>
        )}
      </div>

      <div className="bg-white px-3 py-3">
        <h3 className="font-medium text-[15px] leading-snug text-gray-900 line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {displayName}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {hasFlashSale ? (
            <>
              <p className="text-sm font-semibold text-red-600">{formatPrice(salePrice!)}</p>
              <p className="text-xs text-gray-400 line-through">{formatPrice(originalPrice!)}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">{product ? getProductPrice(product) : ""}</p>
              {compareAtPrice && (
                <p className="text-xs text-gray-400 line-through">{compareAtPrice}</p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
