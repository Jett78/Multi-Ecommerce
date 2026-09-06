"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product, ProductVariant } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import { ChevronLeft } from "lucide-react";
import ProductImages from "@/components/product-images";
import ProductInfo from "@/components/product-info";
import RatingSummary from "@/components/rating-summary";
import ReviewList from "@/components/review-list";
import ReviewForm from "@/components/review-form";
import RelatedProducts from "@/components/product/related-products";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
  flashSale?: ActiveFlashSaleProduct | null;
}

export default function ProductDetailClient({ product, relatedProducts = [], flashSale }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );

  const displayImages = product.images || [];
  const currentStock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const isInStock = currentStock > 0;

  const matchingFlashSale = flashSale && selectedVariant && flashSale.variantId === selectedVariant.id
    ? flashSale
    : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 mb-8 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="md:sticky md:top-6 md:self-start">
            <ProductImages
              images={displayImages}
              productName={product.name}
              isInStock={isInStock}
            />
          </div>

          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            flashSale={matchingFlashSale}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Rating Summary - Left Side */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Customer Reviews</h2>
              <RatingSummary productId={product.id} />
              <div className="mt-6">
                <ReviewForm productId={product.id} />
              </div>
            </div>

            {/* Reviews List - Right Side */}
            <div className="lg:col-span-2">
              <ReviewList productId={product.id} />
            </div>
          </div>
        </div>

        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
