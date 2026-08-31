import { getNewArrivals } from "@/actions/homepage-actions";
import ProductSlider from "@/components/product-slider";

export default async function NewArrivals() {
  const products = await getNewArrivals(10);

  if (products.length === 0) return null;

  return (
    <ProductSlider
      products={products}
      title="New Arrivals"
      subtitle="Just In"
    />
  );
}
