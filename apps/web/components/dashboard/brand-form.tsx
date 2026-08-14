"use client";

import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FileUpload from "@/components/ui/file-upload";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateBrands } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import type { BrandFormProps } from "@/types/components";

export function BrandForm({ brand }: BrandFormProps) {
  const isEditing = !!brand;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.BRAND,
    queryKey: "brands",
    isAuthenticated: true,
  });

  const { values, errors, setField } = useForm({
    name: brand?.name || "",
    imageKey: brand?.imageKey || "",
    sortOrder: brand?.sortOrder?.toString() || "",
    isActive: brand?.isActive ?? true,
  });

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Brand",
    redirectPath: "/dashboard/brands",
    entityId: brand?.id,
    revalidateAction: async () => {
      await revalidateBrands();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      name: values.name,
      imageKey: values.imageKey,
      isActive: values.isActive,
    };

    if (isEditing && values.sortOrder !== "") {
      payload.sortOrder = parseInt(values.sortOrder, 10);
    }

    if (isEditing) {
      put.mutate({ id: brand.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isPending && <SubmittingLoader status={isEditing ? "Updating brand" : "Creating brand"} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Brand Information</h3>
          <p className="text-xs text-slate-500 mt-1">Basic brand details.</p>
        </div>

        <FormField
          label="Name *"
          name="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Brand name"
          errors={errors.name}
        />
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Brand Logo</h3>
          <p className="text-xs text-slate-500 mt-1">Upload a brand logo image.</p>
        </div>

        <FileUpload
          defaultImage={values.imageKey}
          onSuccess={({ url }) => setField("imageKey", url)}
          returnType="url"
          folder="brands"
        />
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
              onChange={(e) => setField("sortOrder", e.target.value)}
              placeholder="Auto-calculated"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="isActive"
                value={values.isActive ? "true" : "false"}
                onChange={(e) => setField("isActive", e.target.value === "true")}
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
          text={isEditing ? "Update Brand" : "Create Brand"}
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
