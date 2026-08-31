import { getBestSellers } from "@/actions/homepage-actions";
import ProductSlider from "@/components/product-slider";

export default async function BestSellers() {
  const products = await getBestSellers(10);

  if (products.length === 0) return null;

  return (
    <ProductSlider
      products={products}
      title="Best Sellers"
      subtitle="Top Rated"
    />
  );
}
