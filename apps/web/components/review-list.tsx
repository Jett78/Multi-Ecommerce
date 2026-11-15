"use client";

import { useEffect, useState } from "react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Review, ReviewReply } from "@/types/review";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccess, showError } from "@/lib/toast-helper";
import { getImageUrl } from "@/lib/utils";
import Rating from "@/components/rating";
import {
  ThumbsUp,
  MessageSquare,
  Send,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Reply,
} from "lucide-react";

interface ReviewListProps {
  productId: string;
  ratingFilter?: number | null;
  onRatingFilter?: (rating: number | null) => void;
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

function timeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UserAvatar({
  name,
  image,
  size = "md",
}: {
  name?: string;
  image?: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "w-6 h-6 text-[10px]" : "w-10 h-10 text-sm";
  const resolvedImage = image ? getImageUrl(image) : "";

  if (resolvedImage) {
    return (
      <div
        className={`${dimensions} rounded-full overflow-hidden bg-gray-100 flex-shrink-0`}
      >
        <img
          src={resolvedImage}
          alt={name || "User"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} rounded-full bg-gray-900 text-white flex items-center justify-center font-bold flex-shrink-0`}
    >
      {(name || "U").charAt(0).toUpperCase()}
    </div>
  );
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
  replyingToId,
  onToggleReply,
}: {
  reply: TreeNode;
  reviewId: string;
  depth: number;
  onDelete: (reviewId: string, replyId: string) => void;
  replyTexts: Record<string, string>;
  setReplyTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  onSubmitReply: (reviewId: string, parentId?: string) => void;
  replyingToId: string | null;
  onToggleReply: (replyId: string) => void;
}) {
  return (
    <div className={depth > 0 ? "ml-6 pl-4 border-l border-gray-200" : ""}>
      <div className="bg-gray-50 border border-gray-100 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <UserAvatar
            name={(reply as any)?.userName}
            image={(reply as any)?.userImage}
            size="sm"
          />
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
            onClick={() => onToggleReply(reply.id)}
            className={`text-[11px] transition-colors flex items-center gap-1 ${
              replyingToId === reply.id
                ? "text-primarymain font-medium"
                : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <Reply size={10} />
            Reply
          </button>
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
              replyingToId={replyingToId}
              onToggleReply={onToggleReply}
            />
          ))}
        </div>
      )}

      {replyingToId === reply.id && (
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
            className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-primarymain transition-colors bg-white"
            disabled={isSubmitting}
            autoFocus
          />
          <button
            onClick={() => onSubmitReply(reviewId, reply.id)}
            disabled={isSubmitting || !replyTexts[`${reviewId}-${reply.id}`]?.trim()}
            className="px-3 py-2 bg-primarymain text-white hover:bg-primarymain/90 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewList({
  productId,
  ratingFilter,
  onRatingFilter,
}: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [internalFilter, setInternalFilter] = useState<number | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const take = 10;
  const queryClient = useQueryClient();

  const activeFilter = ratingFilter !== undefined ? ratingFilter : internalFilter;

  // Reset pagination whenever the filter changes — including changes
  // driven externally by the rating breakdown bars.
  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const endpoint = `${API_ROUTES.PRODUCT}/${productId}/reviews`;
  const { getAllPaginated } = useCrud<Review>({
    endpoint,
    queryKey: "reviews",
  });

  const repliesEndpoint = expandedReviewId
    ? `${API_ROUTES.PRODUCT}/reviews/${expandedReviewId}/replies`
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
    ...(activeFilter !== null ? { rating: activeFilter } : {}),
  };

  const { data, isLoading } = getAllPaginated(reviewParams);

  const handleRatingFilter = (rating: number | null) => {
    if (onRatingFilter) {
      onRatingFilter(rating);
    } else {
      setInternalFilter(rating);
    }
    setPage(1);
  };

  const repliesQuery = getAllReplies(undefined, { enabled: !!expandedReviewId });
  const flatReplies = (repliesQuery?.data as ReviewReply[] | undefined) || [];

  const toggleReplies = (reviewId: string) => {
    setExpandedReviewId((prev) => (prev === reviewId ? null : reviewId));
    setReplyingToId(null);
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
          if (parentId) setReplyingToId(null);
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
          <div key={i} className="animate-pulse border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-gray-100" />
                <div className="h-3 w-20 bg-gray-100" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 w-full mb-1" />
            <div className="h-3 bg-gray-100 w-2/3" />
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
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          {total} {total === 1 ? "review" : "reviews"}
          {activeFilter !== null ? ` · ${activeFilter}★` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRatingFilter(null)}
            className={`px-3.5 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
              activeFilter === null
                ? "bg-primarymain text-white"
                : "border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              className={`px-3.5 py-1.5 text-[11px] font-bold tracking-widest transition-colors ${
                activeFilter === rating
                  ? "bg-primarymain text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900"
              }`}
            >
              {rating} ★
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="border border-gray-200 py-16 px-6 text-center">
          <div className="w-12 h-12 mx-auto border border-gray-200 flex items-center justify-center mb-4">
            <MessageSquare size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            {activeFilter !== null
              ? `No ${activeFilter}★ reviews yet`
              : "No reviews yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            {activeFilter !== null
              ? "Try another rating filter"
              : "Be the first to share your experience"}
          </p>
          {activeFilter !== null && (
            <button
              onClick={() => handleRatingFilter(null)}
              className="mt-4 text-[11px] font-bold tracking-widest uppercase text-primarymain hover:text-primarymain/80 transition-colors"
            >
              Show all reviews
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => {
            const isExpanded = expandedReviewId === review.id;
            const replyCount = isExpanded
              ? flatReplies.length
              : (review.replyCount ?? 0);

            return (
              <article
                key={review.id}
                className="border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={review.userName} image={review.userImage} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">
                            {review.userName || "Anonymous"}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 uppercase tracking-wide">
                              <Check size={10} />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Rating rating={review.rating * 10} size="sm" />
                          <span className="text-[11px] text-gray-400">
                            · {timeAgo(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h4 className="font-bold text-gray-900 mt-4">{review.title}</h4>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed mt-2">
                      {review.comment}
                    </p>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {review.images.map((imageKey, index) => (
                        <img
                          key={index}
                          src={getImageUrl(imageKey)}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover border border-gray-200 hover:border-gray-900 transition-colors cursor-pointer"
                        />
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    {review.helpfulCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ThumbsUp size={12} />
                        {review.helpfulCount} helpful
                      </span>
                    )}
                    <button
                      onClick={() => toggleReplies(review.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        isExpanded
                          ? "text-primarymain font-medium"
                          : "text-gray-400 hover:text-gray-900"
                      }`}
                    >
                      <MessageSquare size={12} />
                      {replyCount > 0
                        ? `${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}`
                        : "Reply"}
                    </button>
                  </div>
                </div>

                {/* Replies Section */}
                {isExpanded && (
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
                            replyingToId={replyingToId}
                            onToggleReply={(replyId) =>
                              setReplyingToId((prev) =>
                                prev === replyId ? null : replyId
                              )
                            }
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
              </article>
            );
          })}
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