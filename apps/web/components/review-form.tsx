"use client";

import { useState } from "react";
import { Star, X, ImageIcon } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helper";
import { uploadMultipleImages } from "@/actions/upload-action";
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

  return (
    <>
      {create.isPending && <SubmittingLoader status="Submitting review" />}
      <form onSubmit={handleSubmit} className="space-y-4 border-2 border-zinc-200 p-4">
        <h3 className="font-syne font-bold text-xl">WRITE A REVIEW</h3>

        {/* Rating Selection */}
        <div>
          <label className="font-space text-xs font-bold uppercase tracking-wider mb-2 block">
            Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-zinc-200 text-zinc-200"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="font-space text-xs text-zinc-500 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="font-space text-xs font-bold uppercase tracking-wider mb-2 block">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review"
            className="w-full px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black"
            maxLength={255}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="font-space text-xs font-bold uppercase tracking-wider mb-2 block">
            Review (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike?"
            rows={4}
            className="w-full px-3 py-2 border-2 border-zinc-200 font-space text-sm focus:outline-none focus:border-black resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="font-space text-xs font-bold uppercase tracking-wider mb-2 block">
            Images (optional, max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((imageKey, index) => (
              <div key={index} className="relative w-20 h-20 border-2 border-zinc-200">
                <img
                  src={imageKey}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                <ImageIcon size={20} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 mt-1">
                  {uploading ? "Uploading..." : "Add"}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={create.isPending || rating === 0 || uploading}
          className="w-full py-3 bg-black text-white font-space text-sm font-bold hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
        >
          {create.isPending ? "SUBMITTING..." : "SUBMIT REVIEW"}
        </button>

        <p className="font-space text-xs text-zinc-500 text-center">
          Your review will be visible after moderation
        </p>
      </form>
    </>
  );
}
