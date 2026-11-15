"use client";

import { useState } from "react";
import { Star, X, Camera } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helper";
import { uploadMultipleImages } from "@/actions/upload-action";
import { getImageUrl } from "@/lib/utils";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Review } from "@/types/review";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const endpoint = `${API_ROUTES.PRODUCT}/${productId}/reviews`;
  const { create } = useCrud<Review>({
    endpoint,
    queryKey: "reviews",
    isAuthenticated: true,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      showError("Maximum 5 images allowed");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          formData.append("files", file);
        }
      }
      formData.append("folder", "reviews");

      const result = await uploadMultipleImages(formData);
      if (result.success && result.data) {
        setImages([...images, ...result.data.map((img) => img.key)]);
        showSuccess(`${result.data.length} image(s) uploaded`);
      } else {
        showError(result.error || "Failed to upload images");
      }
    } catch (error) {
      showError("Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showError("Please select a rating");
      return;
    }
    create.mutate(
      {
        rating,
        title: title || undefined,
        comment: comment || undefined,
        images: images.length > 0 ? images : undefined,
      } as any,
      {
        onSuccess: () => {
          showSuccess("Review submitted successfully! It will appear after moderation.");
          setRating(0);
          setTitle("");
          setComment("");
          setImages([]);
          onSuccess?.();
        },
        onError: (error: any) => {
          showError(error.message || "Failed to submit review");
        },
      }
    );
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const activeLabel = ratingLabels[hoverRating || rating];

  return (
    <>
      {create.isPending && <SubmittingLoader status="Submitting review" />}
      <div className="border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">
            Your Experience
          </p>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Write a Review
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Rating Selection */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">
              Your Rating *
            </label>
            <div className="flex items-center gap-3 min-h-[40px]">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span
                className={`text-sm font-medium transition-opacity ${
                  activeLabel ? "text-gray-900 opacity-100" : "opacity-0"
                }`}
              >
                {activeLabel || " "}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors"
              maxLength={255}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
              Your Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you liked or disliked..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-900 resize-none transition-colors"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">
              Photos (optional, max 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((imageKey, index) => (
                <div key={index} className="relative w-20 h-20 border border-gray-200 group">
                  <img
                    src={getImageUrl(imageKey)}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-900 transition-colors">
                  <Camera size={18} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">
                    {uploading ? "Uploading..." : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1 space-y-3">
            <p className="text-[11px] text-gray-400">
              Your review will appear after moderation
            </p>
            <button
              type="submit"
              disabled={create.isPending || rating === 0 || uploading}
              className="w-full py-3.5 bg-primarymain text-white text-sm font-bold tracking-wide hover:bg-primarymain/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {create.isPending ? "SUBMITTING..." : "SUBMIT REVIEW"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}