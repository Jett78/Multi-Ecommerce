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
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const textClasses = {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const displayRating = rating / 10;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
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
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={`font-semibold text-gray-900 ${textClasses[size]} ml-0.5`}>
          {displayRating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={`text-gray-400 ${textClasses[size]} ml-0.5`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
