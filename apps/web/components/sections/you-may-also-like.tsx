import { getYouMayAlsoLike } from "@/actions/homepage-actions";
import ProductSlider from "@/components/product-slider";

export default async function YouMayAlsoLike() {
  const products = await getYouMayAlsoLike(10);

  if (products.length === 0) return null;

  return (
    <ProductSlider
      products={products}
      title="You May Also Like"
      subtitle="Recommended"
    />
  );
}
