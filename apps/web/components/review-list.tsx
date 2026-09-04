"use client";

import { useState } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Review, ReviewReply } from "@/types/review";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { showSuccess, showError } from "@/lib/toast-helper";
import Rating from "@/components/rating";
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ReviewListProps {
  productId: string;
}

interface TreeNode {
  id: string;
  comment: string;
  createdAt: string;
  isAdminReply?: boolean;
  userName?: string;
  userImage?: string;
  userRole?: string;
  parentId?: string;
  replies?: TreeNode[];
}

function buildReplyTree(replies: ReviewReply[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  replies.forEach((reply) => {
    map.set(reply.id, { ...reply, replies: [] });
  });

  replies.forEach((reply) => {
    const node = map.get(reply.id);
    if (!node) return;
    if (reply.parentId) {
      const parent = map.get(reply.parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function ReplyItem({
  reply,
  reviewId,
  depth,
  onDelete,
  replyTexts,
  setReplyTexts,
  isSubmitting,
  onSubmitReply,
}: {
  reply: TreeNode;
  reviewId: string;
  depth: number;
  onDelete: (reviewId: string, replyId: string) => void;
  replyTexts: Record<string, string>;
  setReplyTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  onSubmitReply: (reviewId: string, parentId?: string) => void;
}) {
  return (
    <div className={`${depth > 0 ? "ml-6" : ""}`}>
      <div className="bg-gray-50 border border-gray-100 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
            {(reply as any)?.userName?.[0] || "U"}
          </div>
          <span className="text-xs font-bold text-gray-900">
            {(reply as any)?.userName || "User"}
          </span>
          {(reply as any)?.isAdminReply && (
            <span className="text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5">
              ADMIN
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            {new Date(reply.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <p className="text-sm text-gray-700">{reply.comment}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onDelete(reviewId, reply.id)}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={10} />
            Delete
          </button>
        </div>
      </div>

      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {reply.replies.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              reviewId={reviewId}
              depth={depth + 1}
              onDelete={onDelete}
              replyTexts={replyTexts}
              setReplyTexts={setReplyTexts}
              isSubmitting={isSubmitting}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={replyTexts[`${reviewId}-${reply.id}`] || ""}
          onChange={(e) =>
            setReplyTexts((prev) => ({
              ...prev,
              [`${reviewId}-${reply.id}`]: e.target.value,
            }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmitReply(reviewId, reply.id);
            }
          }}
          placeholder="Write a reply..."
          className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-primarymain transition-colors"
          disabled={isSubmitting}
        />
        <button
          onClick={() => onSubmitReply(reviewId, reply.id)}
          disabled={isSubmitting || !replyTexts[`${reviewId}-${reply.id}`]?.trim()}
          className="px-3 py-2 bg-primarymain text-white hover:bg-primarymain/90 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const take = 10;
  const queryClient = useQueryClient();

  const endpoint = `${API_ROUTES.PRODUCT}/${productId}/reviews`;
  const { getAllPaginated } = useCrud<Review>({
    endpoint,
    queryKey: "reviews",
  });

  const repliesEndpoint = activeReviewId
    ? `${API_ROUTES.PRODUCT}/reviews/${activeReviewId}/replies`
    : "";

  const { getAll: getAllReplies, create: createReply, remove: removeReply } = useCrud<ReviewReply>({
    endpoint: repliesEndpoint,
    queryKey: "review-replies",
    isAuthenticated: true,
  });

  const reviewParams = {
    skip: (page - 1) * take,
    take,
    isApproved: true,
    ...(ratingFilter !== null ? { rating: ratingFilter } : {}),
  };

  const { data, isLoading } = getAllPaginated(reviewParams);

  const handleRatingFilter = (rating: number | null) => {
    setRatingFilter(rating);
    setPage(1);
  };

  const repliesQuery = activeReviewId ? getAllReplies() : null;
  const flatReplies = (repliesQuery?.data as ReviewReply[] | undefined) || [];

  const toggleReplies = (reviewId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
      setActiveReviewId(null);
    } else {
      newExpanded.add(reviewId);
      setActiveReviewId(reviewId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleReplySubmit = (reviewId: string, parentId?: string) => {
    const textKey = parentId ? `${reviewId}-${parentId}` : reviewId;
    const text = replyTexts[textKey];
    if (!text?.trim()) return;

    createReply.mutate(
      { comment: text, parentId } as any,
      {
        onSuccess: () => {
          showSuccess("Reply posted!");
          setReplyTexts((prev) => ({ ...prev, [textKey]: "" }));
          queryClient.invalidateQueries({ queryKey: ["review-replies"] });
        },
        onError: () => showError("Failed to post reply"),
      }
    );
  };

  const handleDeleteReply = (reviewId: string, replyId: string) => {
    removeReply.mutate(replyId, {
      onSuccess: () => {
        showSuccess("Reply deleted");
        queryClient.invalidateQueries({ queryKey: ["review-replies"] });
      },
      onError: () => showError("Failed to delete reply"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border border-gray-200 p-4">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-4 h-4 bg-gray-200" />
              ))}
            </div>
            <div className="h-3 bg-gray-200 w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 w-full mb-1" />
            <div className="h-3 bg-gray-200 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const reviews = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / take);
  const replyTree = buildReplyTree(flatReplies);

  return (
    <div className="space-y-6">
      {/* Rating Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleRatingFilter(null)}
          className={`px-4 py-2 text-xs font-bold tracking-wide transition-colors ${
            ratingFilter === null
              ? "bg-primarymain text-white"
              : "border border-gray-200 text-gray-600 hover:border-primarymain"
          }`}
        >
          ALL
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => handleRatingFilter(rating)}
            className={`px-4 py-2 text-xs font-bold tracking-wide transition-colors ${
              ratingFilter === rating
                ? "bg-primarymain text-white"
                : "border border-gray-200 text-gray-600 hover:border-primarymain"
            }`}
          >
            {rating} ★
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 border border-gray-200">
          <p className="text-sm text-gray-400">No reviews yet</p>
          <p className="text-xs text-gray-300 mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <div
              key={review.id}
              className="border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Rating rating={review.rating} size="sm" />
                    {review.title && (
                      <h4 className="font-bold text-gray-900 mt-2">{review.title}</h4>
                    )}
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1">
                      <Check size={12} />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {review.images.map((imageKey, index) => (
                      <img
                        key={index}
                        src={imageKey}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover border border-gray-200 hover:border-gray-900 transition-colors cursor-pointer"
                      />
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {review.helpfulCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ThumbsUp size={12} />
                      {review.helpfulCount} helpful
                    </span>
                  )}
                  <button
                    onClick={() => toggleReplies(review.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <MessageSquare size={12} />
                    {flatReplies.length || 0} Replies
                  </button>
                </div>
              </div>

              {/* Replies Section */}
              {expandedReplies.has(review.id) && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  {replyTree.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {replyTree.map((reply) => (
                        <ReplyItem
                          key={reply.id}
                          reply={reply}
                          reviewId={review.id}
                          depth={0}
                          onDelete={handleDeleteReply}
                          replyTexts={replyTexts}
                          setReplyTexts={setReplyTexts}
                          isSubmitting={createReply.isPending}
                          onSubmitReply={handleReplySubmit}
                        />
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyTexts[review.id] || ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({
                          ...prev,
                          [review.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(review.id);
                        }
                      }}
                      placeholder="Write a reply..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-primarymain transition-colors bg-white"
                      disabled={createReply.isPending}
                    />
                    <button
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={
                        createReply.isPending || !replyTexts[review.id]?.trim()
                      }
                      className="px-4 py-2.5 bg-primarymain text-white hover:bg-primarymain/90 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
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
            className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 5) return true;
              if (p === 1 || p === totalPages) return true;
              if (Math.abs(p - page) <= 1) return true;
              return false;
            })
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === "string" ? (
                <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-300 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-primarymain text-white"
                      : "border border-gray-200 text-gray-600 hover:border-primarymain"
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
