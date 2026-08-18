"use client";

import { Star } from "lucide-react";

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export default function Rating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className = "",
}: RatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Rating is stored as integer (45 = 4.5 stars)
  const displayRating = rating / 10;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const filled = displayRating >= starValue;
          const halfFilled = !filled && displayRating >= starValue - 0.5;

          return (
            <div key={index} className="relative">
              <Star
                className={`${sizeClasses[size]} ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : halfFilled
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "fill-zinc-200 text-zinc-200"
                }`}
              />
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={`font-space font-bold ${textClasses[size]}`}>
          {displayRating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={`font-space text-zinc-500 ${textClasses[size]}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
