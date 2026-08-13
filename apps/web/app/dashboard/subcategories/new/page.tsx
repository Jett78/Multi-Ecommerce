import { SubcategoryForm } from "@/components/dashboard/subcategory-form";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "New Subcategory | Dashboard",
};

export default function NewSubcategoryPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Create New Subcategory</h2>
        <BreadCrumbs path="subcategories" page="Add" />
      </div>
      <SubcategoryForm />
    </div>
  );
}
