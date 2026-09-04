"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { showSuccess } from "@/lib/toast-helper";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface WishlistButtonProps {
  product: Product;
  variantId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getWishlistItemData(product: Product, variantId?: string) {
  const variant = variantId
    ? product.variants?.find((v) => v.id === variantId)
    : product.variants?.[0];
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  return {
    variantId: variantId || variant?.id || product.id,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    price: variant?.price ?? product.price ?? 0,
    imageUrl: primaryImage?.url,
    attributes: variant?.attributes?.map((a) => ({
      attributeName: a.attributeName,
      attributeValue: a.attributeValue,
    })),
  };
}

export default function WishlistButton({
  product,
  variantId,
  size = "md",
  className,
}: WishlistButtonProps) {
  const { toggleItem, items } = useWishlistStore();
  const itemData = getWishlistItemData(product, variantId);
  const isWishlisted = items.some((i) => i.variantId === itemData.variantId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(itemData);
    showSuccess(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSize = { sm: 14, md: 18, lg: 20 };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        sizeClasses[size],
        isWishlisted
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/80 text-gray-400 hover:bg-white hover:text-gray-600",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={iconSize[size]}
        className={cn("transition-all", isWishlisted && "fill-current")}
      />
    </button>
  );
}
