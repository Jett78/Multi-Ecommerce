import { BrandForm } from "@/components/dashboard/brand-form";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "New Brand | Dashboard",
};

export default function NewBrandPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Create New Brand</h2>
        <BreadCrumbs path="brands" page="Add" />
      </div>
      <BrandForm />
    </div>
  );
}
