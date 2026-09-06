"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap, ArrowLeft, ChevronRight } from "lucide-react";
import CountdownTimer from "@/components/countdown-timer";
import { formatPrice } from "@/lib/utils";
import type { FlashSale, ActiveFlashSaleProduct } from "@/types/flash-sale";

interface FlashSalePageClientProps {
  sale: FlashSale | null;
  products: ActiveFlashSaleProduct[];
}

export default function FlashSalePageClient({ sale, products }: FlashSalePageClientProps) {
  if (!sale || products.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Zap className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No Active Flash Sale</h1>
        <p className="text-gray-500 mb-6">Check back later for amazing deals!</p>
        <Link
          href="/products"
          className="bg-primarymain text-white px-6 py-3 text-sm font-bold tracking-wide rounded-xl hover:bg-primarymain/90 transition-colors"
        >
          BROWSE PRODUCTS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primarymain via-indigo-600 to-violet-600">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/70 text-sm font-medium hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                  <Zap className="h-6 w-6 text-white" fill="currentColor" />
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-[11px] font-bold text-white uppercase tracking-widest">
                  Limited Time Offer
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2">
                {sale.name}
              </h1>
              {sale.description && (
                <p className="text-white/80 mt-2 max-w-xl text-lg">{sale.description}</p>
              )}
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2">
                Time Remaining
              </p>
              <CountdownTimer endsAt={sale.endsAt} />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{products.length}</span> product{products.length !== 1 ? "s" : ""} on sale
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((item) => {
            const discountPercent = Math.round(
              ((item.originalPrice - item.salePrice) / item.originalPrice) * 100
            );
            const stockRemaining = item.maxQuantity
              ? item.maxQuantity - item.soldQuantity
              : null;

            return (
              <Link
                key={item.id}
                href={`/products/${item.productSlug}`}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primarymain hover:shadow-lg hover:shadow-primarymain/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-200">
                      {item.productName.charAt(0)}
                    </div>
                  )}
                  {/* Flash Sale badge - matching ProductCard style */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-1 z-10 flex items-center gap-1 shadow-md">
                    <span>FLASH SALE</span>
                    <span>{discountPercent}% OFF</span>
                  </div>
                  {/* Stock bar */}
                  {stockRemaining !== null && stockRemaining <= 10 && (
                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                        <div className="flex items-center justify-between text-[10px] text-white mb-1">
                          <span>Stock left</span>
                          <span className="font-bold">{stockRemaining}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                          <div
                            className="bg-primarymain h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.max(5, (stockRemaining / (item.maxQuantity || stockRemaining)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-sm leading-snug text-gray-900 line-clamp-2 group-hover:text-primarymain transition-colors mb-2">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">
                      {formatPrice(item.salePrice)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(item.originalPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
