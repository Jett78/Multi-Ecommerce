import { getBrandById } from "@/actions/brand-action";
import { BrandForm } from "@/components/dashboard/brand-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "Edit Brand | Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBrandPage({ params }: PageProps) {
  const { id } = await params;
  const brand = await getBrandById(id);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Edit Brand</h2>
        <BreadCrumbs path="brands" page="Edit" />
      </div>
      {brand ? <BrandForm brand={brand} /> : <NoData title="Brand" />}
    </div>
  );
}
