"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FormField from "@/components/forms/form-field";
import FileUpload from "@/components/ui/file-upload";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateBanners } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import type { BannerFormProps } from "@/types/components";

export function BannerForm({ banner }: BannerFormProps) {
  const isEditing = !!banner;
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl || "");

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.BANNER,
    queryKey: "banners",
    isAuthenticated: true,
  });

  const { values, handleChange } = useForm({
    title: banner?.title || "",
    type: banner?.type || "hero",
    link: banner?.link || "",
    sortOrder: banner?.sortOrder?.toString() || "",
    isActive: banner?.isActive?.toString() || "true",
  });

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Banner",
    redirectPath: "/dashboard/banners",
    entityId: banner?.id,
    revalidateAction: revalidateBanners,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      return;
    }

    const payload: Record<string, any> = {
      title: values.title,
      imageUrl,
      type: values.type,
      link: values.link || undefined,
      isActive: values.isActive === "true",
    };

    if (isEditing && values.sortOrder !== "") {
      payload.sortOrder = parseInt(values.sortOrder, 10);
    }

    if (isEditing) {
      put.mutate({ id: banner.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isPending && <SubmittingLoader status={isEditing ? "Updating Banner" : "Creating Banner"} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Banner Information</h3>
          <p className="text-xs text-slate-500 mt-1">Title, image, and type details.</p>
        </div>

        <FormField
          label="Title *"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="Enter banner title"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Banner Image *</label>
          <FileUpload
            onSuccess={(file) => setImageUrl(file.url)}
            defaultImage={banner?.imageUrl}
            folder="banners"
          />
          {!imageUrl && (
            <p className="text-xs text-red-500">Banner image is required</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Type *</label>
            <select
              name="type"
              value={values.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="hero">Hero</option>
              <option value="mid">Mid</option>
            </select>
          </div>

          <FormField
            label="Redirect URL"
            name="link"
            value={values.link}
            onChange={handleChange}
            placeholder="https://example.com/page"
          />
        </div>
      </div>

      {isEditing && (
        <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Control display order and visibility.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Sort Order"
              name="sortOrder"
              type="number"
              value={values.sortOrder}
              onChange={handleChange}
              placeholder="Auto-calculated"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="isActive"
                value={values.isActive}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <PrimaryButton
          type="submit"
          text={isEditing ? "Update Banner" : "Create Banner"}
          disabled={isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
