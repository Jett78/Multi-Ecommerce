"use client";

import { useState } from "react";
import { API_ROUTES } from "@/config/api-routes";
import Rating from "@/components/rating";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
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
import type { Review } from "@/types/review";
import { Check, X, Trash2, Star, Mail, Phone, Shield, BadgeCheck } from "lucide-react";
import NoData from "@/components/no-data";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const take = 20;

  const { getAllPaginated, put, remove } = useCrud<Review>({
    endpoint: `${API_ROUTES.PRODUCT}/reviews/all`,
    queryKey: "admin-reviews",
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

  return (
    <div className="space-y-6">
      <DashboardHeading
        title="Review Moderation"
        description="Approve or delete customer reviews"
      />

      {/* Status Filter */}
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

      {/* Reviews List */}
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
              {/* Top Bar - Status */}
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
                  {/* Left - User Avatar & Product */}
                  <div className="flex flex-col items-center gap-3">
                    {/* User Avatar */}
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
                    {/* Product Thumbnail */}
                    {review.productImage && (
                      <img
                        src={review.productImage}
                        alt={review.productName || "Product"}
                        className="w-14 h-14 object-cover rounded-lg border border-zinc-200"
                      />
                    )}
                  </div>

                  {/* Right - Content */}
                  <div className="flex-1 min-w-0">
                    {/* User Info Row */}
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

                    {/* Contact Info */}
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

                    {/* Product & Rating Row */}
                    <div className="flex items-center gap-3 mb-3">
                      {review.productName && (
                        <span className="font-space text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg">
                          {review.productName}
                        </span>
                      )}
                      <Rating rating={review.rating} size="sm" />
                    </div>

                    {/* Review Content */}
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

                    {/* Review Images */}
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

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 justify-end">
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
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-space text-sm text-zinc-500">
            Showing {((page - 1) * take) + 1} - {Math.min(page * take, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 font-space text-xs border-2 border-zinc-200 hover:border-black disabled:opacity-50"
            >
              PREV
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 font-space text-xs border-2 border-zinc-200 hover:border-black disabled:opacity-50"
            >
              NEXT
            </button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
