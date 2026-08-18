"use client";

import { useState } from "react";
import Rating from "@/components/rating";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Review } from "@/types/review";
import { Check, ThumbsUp } from "lucide-react";

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const take = 10;

  const endpoint = `${API_ROUTES.PRODUCT}/${productId}/reviews`;
  const { getAllPaginated } = useCrud<Review>({
    endpoint,
    queryKey: "reviews",
  });

  const { data, isLoading } = getAllPaginated({
    skip: (page - 1) * take,
    take,
    isApproved: true,
    ...(ratingFilter ? { rating: ratingFilter } : {}),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-24 bg-zinc-200" />
              <div className="h-4 w-16 bg-zinc-200" />
            </div>
            <div className="h-4 w-48 bg-zinc-200 mb-2" />
            <div className="h-20 bg-zinc-200" />
          </div>
        ))}
      </div>
    );
  }

  const reviews = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      {/* Rating Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setRatingFilter(null)}
          className={`px-3 py-1 font-space text-xs border-2 transition-colors ${
            ratingFilter === null
              ? "border-black bg-black text-white"
              : "border-zinc-200 hover:border-zinc-400"
          }`}
        >
          ALL
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setRatingFilter(rating)}
            className={`px-3 py-1 font-space text-xs border-2 transition-colors ${
              ratingFilter === rating
                ? "border-black bg-black text-white"
                : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {rating} ★
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-200">
          <p className="font-space text-zinc-500">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <div
              key={review.id}
              className="border-2 border-zinc-200 p-4 hover:border-zinc-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Rating rating={review.rating} size="sm" />
                  {review.title && (
                    <h4 className="font-space font-bold mt-1">{review.title}</h4>
                  )}
                </div>
                {review.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 font-space text-xs text-green-600 bg-green-50 px-2 py-1">
                    <Check size={12} />
                    Verified Purchase
                  </span>
                )}
              </div>
              {review.comment && (
                <p className="font-space text-sm text-zinc-700 mt-2">{review.comment}</p>
              )}
              {review.images && review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {review.images.map((imageKey, index) => (
                    <img
                      key={index}
                      src={imageKey}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover border border-zinc-200"
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                <span className="font-space">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {review.helpfulCount > 0 && (
                  <span className="flex items-center gap-1 font-space">
                    <ThumbsUp size={12} />
                    {review.helpfulCount} helpful
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 font-space text-xs border-2 border-zinc-200 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PREV
          </button>
          <span className="font-space text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 font-space text-xs border-2 border-zinc-200 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}
