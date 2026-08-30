import { getBannerById } from "@/actions/banner-action";
import { BannerForm } from "@/components/dashboard/banner-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await getBannerById(id);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Edit Banner</h2>
        <BreadCrumbs path="banners" page="Edit" />
      </div>
      {banner ? <BannerForm banner={banner} /> : <NoData title="Banner" />}
    </div>
  );
}
