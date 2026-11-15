"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import Rating from "@/components/rating";

interface RatingSummaryProps {
  productId: string;
  selectedRating?: number | null;
  onSelectRating?: (rating: number | null) => void;
}

interface RatingBreakdownData {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function RatingSummary({
  productId,
  selectedRating = null,
  onSelectRating,
}: RatingSummaryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["rating-breakdown", productId],
    queryFn: async () => {
      const response = await apiClient<any>(
        `${API_ROUTES.PRODUCT}/${productId}/rating-breakdown`
      );
      return (response?.data ?? response) as RatingBreakdownData;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="border border-gray-200 p-6 space-y-5 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="h-12 w-16 bg-gray-100" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-100" />
            <div className="h-3 w-20 bg-gray-100" />
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { averageRating, totalReviews, breakdown } = data;
  const displayAverage = averageRating.toFixed(1);
  const isFiltered = selectedRating !== null;

  return (
    <div className="border border-gray-200">
      {/* Hero Average */}
      <div className="flex items-center gap-5 p-6 pb-5">
        <span className="text-5xl font-bold tracking-tight text-gray-900 leading-none">
          {displayAverage}
        </span>
        <div>
          <Rating rating={averageRating * 10} size="lg" />
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mt-2">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Breakdown Bars — click a row to filter the list */}
      <div className="px-6 pb-6 pt-4 border-t border-gray-100 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star as keyof typeof breakdown];
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          const isSelected = selectedRating === star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => onSelectRating?.(isSelected ? null : star)}
              disabled={!onSelectRating}
              className={`w-full flex items-center gap-3 px-1 -mx-1 py-1.5 transition-colors ${
                onSelectRating ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
              }`}
            >
              <span
                className={`text-[11px] font-bold w-6 text-left ${
                  isSelected ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {star} ★
              </span>
              <span className="flex-1 h-2 bg-gray-100 overflow-hidden">
                <span
                  className={`block h-full transition-all duration-500 ${
                    isSelected || !isFiltered ? "bg-yellow-400" : "bg-yellow-400/40"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </span>
              <span
                className={`text-[11px] font-semibold w-8 text-right ${
                  isSelected ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {isFiltered && onSelectRating && (
          <button
            type="button"
            onClick={() => onSelectRating(null)}
            className="mt-3 text-[11px] font-bold tracking-widest uppercase text-primarymain hover:text-primarymain/80 transition-colors"
          >
            Clear {selectedRating}★ filter ✕
          </button>
        )}
      </div>
    </div>
  );
}