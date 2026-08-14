"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product, ProductVariant } from "@/types/product";
import { ChevronLeft } from "lucide-react";
import ProductImages from "@/components/product-images";
import ProductInfo from "@/components/product-info";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );

  const displayImages = product.images || [];
  const currentStock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const isInStock = currentStock > 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400..800&display=swap');
        
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-space { font-family: 'Space Mono', monospace; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 mb-8 font-space text-xs font-bold hover:underline"
        >
          <ChevronLeft size={16} />
          BACK TO SHOP
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
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
          />
        </div>
      </div>
    </div>
  );
}
