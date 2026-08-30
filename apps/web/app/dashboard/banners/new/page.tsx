import { BannerForm } from "@/components/dashboard/banner-form";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Create New Banner</h2>
        <BreadCrumbs path="banners" page="Add" />
      </div>
      <BannerForm />
    </div>
  );
}
