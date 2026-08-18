"use client";

import { useState } from "react";
import Rating from "@/components/rating";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { showSuccess, showError } from "@/lib/toast-helper";
import type { Review, ReviewReply } from "@/types/review";
import { Check, ThumbsUp, MessageSquare, Send, Trash2, Reply } from "lucide-react";

interface ReviewListProps {
  productId: string;
}

function buildReplyTree(replies: ReviewReply[] | undefined): ReviewReply[] {
  if (!replies) return [];
  const map = new Map<string, ReviewReply>();
  const roots: ReviewReply[] = [];

  replies.forEach((reply) => {
    map.set(reply.id, { ...reply, replies: [] });
  });

  replies.forEach((reply) => {
    const node = map.get(reply.id)!;
    if (reply.parentId && map.has(reply.parentId)) {
      map.get(reply.parentId)!.replies!.push(node);
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
  reply: ReviewReply;
  reviewId: string;
  depth: number;
  onDelete: (reviewId: string, replyId: string) => void;
  replyTexts: Record<string, string>;
  setReplyTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  onSubmitReply: (reviewId: string, parentId?: string) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const replyKey = `${reviewId}-${reply.id}`;

  return (
    <div className={`${depth > 0 ? "ml-6 mt-2" : ""}`}>
      <div
        className={`flex gap-3 p-3 rounded-lg ${
          reply.isAdminReply
            ? "bg-blue-50 border border-blue-100"
            : "bg-zinc-50 border border-zinc-100"
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-space text-sm font-bold">
              {reply.userName || "Anonymous"}
            </span>
            {reply.isAdminReply && (
              <span className="font-space text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
            <span className="font-space text-xs text-zinc-400">
              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="font-space text-sm text-zinc-700">{reply.comment}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-black font-space transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>
            <button
              onClick={() => onDelete(reviewId, reply.id)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 font-space transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-6 mt-2 flex gap-2">
          <input
            type="text"
            value={replyTexts[replyKey] || ""}
            onChange={(e) =>
              setReplyTexts((prev) => ({ ...prev, [replyKey]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitReply(reviewId, reply.id);
                setShowReplyForm(false);
              }
            }}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black"
            disabled={isSubmitting}
          />
          <button
            onClick={() => {
              onSubmitReply(reviewId, reply.id);
              setShowReplyForm(false);
            }}
            disabled={isSubmitting || !replyTexts[replyKey]?.trim()}
            className="px-3 py-2 bg-black text-white font-space text-xs font-bold hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
          >
            {isSubmitting ? "..." : <Send size={14} />}
          </button>
        </div>
      )}

      {reply.replies && reply.replies.length > 0 && (
        <div className="ml-4">
          {reply.replies.map((childReply) => (
            <ReplyItem
              key={childReply.id}
              reply={childReply}
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

  const { data, isLoading } = getAllPaginated({
    skip: (page - 1) * take,
    take,
    isApproved: true,
    ...(ratingFilter ? { rating: ratingFilter } : {}),
  });

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
    const key = parentId ? `${reviewId}-${parentId}` : reviewId;
    const text = replyTexts[key]?.trim();
    if (!text) return;

    const body: { comment: string; parentId?: string } = { comment: text };
    if (parentId) {
      body.parentId = parentId;
    }

    createReply.mutate(body as any, {
      onSuccess: () => {
        showSuccess("Reply posted successfully");
        setReplyTexts((prev) => ({ ...prev, [key]: "" }));
      },
      onError: (error: any) => {
        showError(error.message || "Failed to post reply");
      },
    });
  };

  const handleDeleteReply = (reviewId: string, replyId: string) => {
    removeReply.mutate(replyId, {
      onSuccess: () => {
        showSuccess("Reply deleted");
      },
      onError: (error: any) => {
        showError(error.message || "Failed to delete reply");
      },
    });
  };

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
  const replyTree = buildReplyTree(flatReplies);

  return (
    <div className="space-y-6">
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
                <button
                  onClick={() => toggleReplies(review.id)}
                  className="flex items-center gap-1 font-space hover:text-black transition-colors"
                >
                  <MessageSquare size={12} />
                  {flatReplies.length || 0} Replies
                </button>
              </div>

              {expandedReplies.has(review.id) && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  {replyTree.length > 0 && (
                    <div className="space-y-2 mb-4">
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
                      className="flex-1 px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black"
                      disabled={createReply.isPending}
                    />
                    <button
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={
                        createReply.isPending || !replyTexts[review.id]?.trim()
                      }
                      className="px-3 py-2 bg-black text-white font-space text-xs font-bold hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
                    >
                      {createReply.isPending ? "..." : <Send size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
