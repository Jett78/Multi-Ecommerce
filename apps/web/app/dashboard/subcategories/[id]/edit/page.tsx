import { getSubcategoryById } from "@/actions/subcategory-action";
import { SubcategoryForm } from "@/components/dashboard/subcategory-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export default async function EditSubcategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subcategory = await getSubcategoryById(id);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Edit Subcategory</h2>
        <BreadCrumbs path="subcategories" page="Edit" />
      </div>
      {subcategory ? <SubcategoryForm subcategory={subcategory} /> : <NoData title="Subcategory" />}
    </div>
  );
}
