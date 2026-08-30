"use client";

import { useState } from "react";
import { API_ROUTES } from "@/config/api-routes";
import Rating from "@/components/rating";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { showSuccess, showError } from "@/lib/toast-helper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCrud } from "@/hooks/useCRUD";
import type { Review, ReviewReply } from "@/types/review";
import {
  Check,
  Trash2,
  Mail,
  Phone,
  Shield,
  BadgeCheck,
  MessageSquare,
  Send,
  Reply,
} from "lucide-react";
import NoData from "@/components/no-data";

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
                hour: "2-digit",
                minute: "2-digit",
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
              Delete
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
            placeholder="Reply as admin..."
            className="flex-1 px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black"
            disabled={isSubmitting}
          />
          <button
            onClick={() => {
              onSubmitReply(reviewId, reply.id);
              setShowReplyForm(false);
            }}
            disabled={isSubmitting || !replyTexts[replyKey]?.trim()}
            className="px-3 py-2 bg-blue-500 text-white font-space text-xs font-bold rounded-lg hover:bg-blue-600 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
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

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const take = 20;

  const { getAllPaginated, put, remove } = useCrud<Review>({
    endpoint: `${API_ROUTES.PRODUCT}/reviews/all`,
    queryKey: "admin-reviews",
    isAuthenticated: true,
  });

  const repliesEndpoint = activeReviewId
    ? `${API_ROUTES.PRODUCT}/reviews/${activeReviewId}/replies`
    : "";

  const { getAll: getAllReplies, create: createReply, remove: removeReply } = useCrud<ReviewReply>({
    endpoint: repliesEndpoint,
    queryKey: "admin-review-replies",
    isAuthenticated: true,
  });

  const { data, isLoading } = getAllPaginated({
    skip: (page - 1) * take,
    take,
    ...(statusFilter === "pending" ? { isApproved: false } : {}),
    ...(statusFilter === "approved" ? { isApproved: true } : {}),
  });

  const reviews = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / take);

  const repliesQuery = activeReviewId ? getAllReplies() : null;
  const flatReplies = (repliesQuery?.data as ReviewReply[] | undefined) || [];
  const replyTree = buildReplyTree(flatReplies);

  const handleApprove = () => {
    if (!selectedReviewId) return;
    put.mutate(
      { id: selectedReviewId, data: {} as Review },
      {
        onSuccess: () => {
          showSuccess("Review approved");
          setApproveDialogOpen(false);
          setSelectedReviewId(null);
        },
        onError: (error: any) => {
          showError(error.message || "Failed to approve review");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedReviewId) return;
    remove.mutate(selectedReviewId, {
      onSuccess: () => {
        showSuccess("Review deleted");
        setDeleteDialogOpen(false);
        setSelectedReviewId(null);
      },
      onError: (error: any) => {
        showError(error.message || "Failed to delete review");
      },
    });
  };

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

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="Review Moderation"
        description="Approve, delete, and reply to customer reviews"
      />

      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 font-space text-xs font-bold border-2 transition-colors ${
              statusFilter === status
                ? "border-black bg-black text-white"
                : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse border border-zinc-200 rounded-xl overflow-hidden">
              <div className="h-10 bg-zinc-100 border-b border-zinc-200" />
              <div className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-200" />
                    <div className="w-14 h-14 rounded-lg bg-zinc-200" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-zinc-200 mb-2" />
                    <div className="h-3 w-48 bg-zinc-200 mb-3" />
                    <div className="h-3 w-24 bg-zinc-200 mb-3" />
                    <div className="h-20 bg-zinc-100 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <NoData title="reviews" />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => (
            <div
              key={review.id}
              className={`border rounded-xl overflow-hidden ${
                review.isApproved ? "border-green-200 bg-white" : "border-zinc-200 bg-white"
              }`}
            >
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  review.isApproved ? "bg-green-50 border-b border-green-100" : "bg-amber-50 border-b border-amber-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-space text-xs font-bold px-2 py-0.5 rounded-full ${
                      review.isApproved
                        ? "text-green-700 bg-green-200"
                        : "text-amber-700 bg-amber-200"
                    }`}
                  >
                    {review.isApproved ? "APPROVED" : "PENDING"}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="font-space text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      VERIFIED PURCHASE
                    </span>
                  )}
                </div>
                <span className="font-space text-xs text-zinc-500">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-3">
                    {review.userImage ? (
                      <img
                        src={review.userImage}
                        alt={review.userName || "User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center border-2 border-zinc-200">
                        <span className="font-space text-lg font-bold text-zinc-600">
                          {review.userName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    {review.productImage && (
                      <img
                        src={review.productImage}
                        alt={review.productName || "Product"}
                        className="w-14 h-14 object-cover rounded-lg border border-zinc-200"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-space text-sm font-bold text-zinc-900">
                        {review.userName || "Anonymous"}
                      </h4>
                      {review.isEmailVerified && (
                        <BadgeCheck size={16} className="text-blue-500" />
                      )}
                      {review.userRole && (
                        <span className="font-space text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full capitalize flex items-center gap-1">
                          <Shield size={10} />
                          {review.userRole}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-xs text-zinc-500">
                      {review.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-zinc-400" />
                          {review.userEmail}
                        </span>
                      )}
                      {review.userPhone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-zinc-400" />
                          {review.userPhone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      {review.productName && (
                        <span className="font-space text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg">
                          {review.productName}
                        </span>
                      )}
                      <Rating rating={review.rating} size="sm" />
                    </div>

                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                      {review.title && (
                        <h5 className="font-space text-sm font-bold text-zinc-900 mb-1">
                          {review.title}
                        </h5>
                      )}
                      {review.comment && (
                        <p className="font-space text-sm text-zinc-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.images.map((imageKey, index) => (
                          <img
                            key={index}
                            src={imageKey}
                            alt={`Review image ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => toggleReplies(review.id)}
                    className="flex items-center gap-1.5 text-zinc-600 hover:text-black font-space text-xs font-bold transition-colors"
                  >
                    <MessageSquare size={14} />
                    {flatReplies.length || 0} Replies
                  </button>

                  <div className="flex items-center gap-2">
                    {!review.isApproved && (
                      <button
                        onClick={() => {
                          setSelectedReviewId(review.id);
                          setApproveDialogOpen(true);
                        }}
                        disabled={put.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white font-space text-xs font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <Check size={14} />
                        APPROVE
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedReviewId(review.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={remove.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-500 border-2 border-red-200 font-space text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      DELETE
                    </button>
                  </div>
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
                        placeholder="Write a reply as admin..."
                        className="flex-1 px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black"
                        disabled={createReply.isPending}
                      />
                      <button
                        onClick={() => handleReplySubmit(review.id)}
                        disabled={
                          createReply.isPending || !replyTexts[review.id]?.trim()
                        }
                        className="px-3 py-2 bg-blue-500 text-white font-space text-xs font-bold rounded-lg hover:bg-blue-600 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
                      >
                        {createReply.isPending ? "..." : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <DashboardPagination page={page} setPage={setPage} totalPages={totalPages} />
      )}
      )}

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this review? It will be visible to all users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={put.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {put.isPending ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {remove.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
