"use client";

import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/primary-button";
import FileUpload from "@/components/ui/file-upload";
import FormField from "@/components/forms/form-field";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { API_ROUTES } from "@/config/api-routes";
import { revalidateSubcategories } from "@/actions/revalidate-action";
import SubmittingLoader from "@/components/dashboard/submitting-loader";
import type { SubcategoryFormProps } from "@/types/components";

export function SubcategoryForm({ subcategory }: SubcategoryFormProps) {
  const isEditing = !!subcategory;

  const { create, put } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.SUBCATEGORY,
    queryKey: "subcategories",
    isAuthenticated: true,
  });

  // Fetch categories for the dropdown
  const { getAll } = useCrud<{ id: string; name: string }>({
    endpoint: API_ROUTES.CATEGORY,
    queryKey: "categories",
  });
  const { data: categoriesData } = getAll({ take: 100, skip: 0 });
  const categories: { id: string; name: string }[] = categoriesData || [];

  const { values, errors, setField } = useForm({
    name: subcategory?.name || "",
    slug: subcategory?.slug || "",
    categoryId: subcategory?.categoryId || "",
    imageKey: subcategory?.imageKey || "",
    sortOrder: subcategory?.sortOrder?.toString() || "",
    isActive: subcategory?.isActive ?? true,
  });

  const isPending = isEditing ? put.isPending : create.isPending;

  const { onSuccess, onError } = useFormSubmit({
    entityName: "Subcategory",
    redirectPath: "/dashboard/subcategories",
    entityId: subcategory?.id,
    revalidateAction: async () => {
      await revalidateSubcategories();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const slug =
      values.slug ||
      values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      name: values.name,
      slug,
      categoryId: values.categoryId,
      imageKey: values.imageKey,
      isActive: values.isActive,
    };

    if (isEditing && values.sortOrder !== "") {
      payload.sortOrder = parseInt(values.sortOrder, 10);
    }

    if (isEditing) {
      put.mutate({ id: subcategory.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isPending && <SubmittingLoader status={isEditing ? "Updating subcategory" : "Creating subcategory"} />}

      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Subcategory Information</h3>
          <p className="text-xs text-slate-500 mt-1">Basic subcategory details.</p>
        </div>

        <FormField
          label="Name *"
          name="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Subcategory name"
          errors={errors.name}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Parent Category *</label>
          <select
            name="categoryId"
            value={values.categoryId}
            onChange={(e) => setField("categoryId", e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Subcategory Image</h3>
          <p className="text-xs text-slate-500 mt-1">Upload a subcategory image.</p>
        </div>

        <FileUpload
          defaultImage={values.imageKey}
          onSuccess={(url) => setField("imageKey", url)}
          returnType="url"
          folder="subcategories"
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
          text={isEditing ? "Update Subcategory" : "Create Subcategory"}
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
