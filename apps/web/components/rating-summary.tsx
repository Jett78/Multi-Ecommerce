"use client";

import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import Rating from "@/components/rating";

interface RatingSummaryProps {
  productId: string;
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

export default function RatingSummary({ productId }: RatingSummaryProps) {
  const endpoint = `${API_ROUTES.PRODUCT}/${productId}/rating-breakdown`;
  const { getOne } = useCrud<RatingBreakdownData>({
    endpoint,
    queryKey: "rating-breakdown",
  });

  const { data, isLoading } = getOne(productId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 bg-zinc-200" />
        <div className="h-4 w-48 bg-zinc-200" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-zinc-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { averageRating, totalReviews, breakdown } = data;

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      <div className="flex items-center gap-4">
        <span className="font-syne text-5xl font-bold">{(averageRating / 10).toFixed(1)}</span>
        <div>
          <Rating rating={averageRating} size="lg" />
          <p className="font-space text-sm text-zinc-500 mt-1">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star as keyof typeof breakdown];
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="font-space text-xs w-8">{star} ★</span>
              <div className="flex-1 h-2 bg-zinc-200 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="font-space text-xs text-zinc-500 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
