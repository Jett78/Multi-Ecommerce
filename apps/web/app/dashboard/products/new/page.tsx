import { ProductForm } from "@/components/dashboard/product-form";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "New Product | Dashboard",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Create New Product</h2>
        <BreadCrumbs path="products" page="Add" />
      </div>
      <ProductForm />
    </div>
  );
}
