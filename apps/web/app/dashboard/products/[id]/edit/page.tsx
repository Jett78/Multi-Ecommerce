import { getProductById } from "@/actions/product-action";
import { ProductForm } from "@/components/dashboard/product-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

function StockBadge({ product }: { product: any }) {
  if (!product) return null;
  const hasVariants = product.variants && product.variants.length > 0;
  const stock = hasVariants
    ? product.variants.reduce((sum: number, v: any) => sum + (v.stockQuantity ?? 0), 0)
    : product.stockQuantity ?? 0;
  const threshold = hasVariants
    ? Math.min(...product.variants.map((v: any) => v.lowStockThreshold ?? 5))
    : product.lowStockThreshold ?? 5;
  const isLow = stock <= threshold;
  const label = hasVariants ? `${stock} out of ${product.variants.length} variants` : `${stock}`;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {isLow && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500" />}
      {label} in stock
    </span>
  );
}

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
        <BreadCrumbs path="products" page="Edit" badge={product ? <StockBadge product={product} /> : undefined} />
      </div>
      {product ? <ProductForm product={product} /> : <NoData title="Product" />}
    </div>
  );
}
