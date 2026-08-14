import { getProductById } from "@/actions/product-action";
import { ProductForm } from "@/components/dashboard/product-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Edit Product</h2>
        <BreadCrumbs path="products" page="Edit" />
      </div>
      {product ? <ProductForm product={product} /> : <NoData title="Product" />}
    </div>
  );
}
