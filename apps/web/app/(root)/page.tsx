import { Hero } from "@/components/sections/hero";
import { Testimonials } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";
import BlogSection from "@/components/sections/blog-section";
import { MidBanner } from "@/components/sections/mid-banner";
import { getBlogs } from "@/actions/blog-action";
import CategorySection from "@/components/sections/category-section";
import FeaturedProducts from "@/components/sections/featured-products";
import BestSellers from "@/components/sections/best-seller-products";
import NewArrivals from "@/components/sections/new-arrivals";
import BrandSection from "@/components/sections/brand-section";
import TrustFeatures from "@/components/sections/trust-features";
import WhyChooseUs from "@/components/sections/why-choose-us";
export default async function Home() {
  const posts = await getBlogs({ take: 3, isActive: true });

  return (
    <>
      <Hero />
      <CategorySection />
      <NewArrivals />
      <WhyChooseUs />
      <BrandSection />
      <BestSellers />
      <MidBanner />
      <FeaturedProducts />
      <TrustFeatures />
      <BlogSection posts={posts} />
      <Testimonials />
      <FaqSection />
    </>
  );
}
