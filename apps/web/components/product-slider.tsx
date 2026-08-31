"use client";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/product";
import ProductCard from "@/components/product-card";

interface ProductSliderProps {
  products: Product[];
  title: string;
  subtitle?: string;
}

const ProductSlider = ({ products, title, subtitle }: ProductSliderProps) => {
  const sliderRef = useRef<Slider | null>(null);

  if (products.length === 0) return null;

  const showSlider = products.length > 4;

  const settings = {
    dots: true,
    infinite: products.length > 4,
    slidesToShow: 5,
    slidesToScroll: 1,
    speed: 1500,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 4 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          {subtitle && (
            <p className="tracking-wider text-foreground uppercase text-sm font-bold mb-1">
              {subtitle}
            </p>
          )}
          <h2 className="font-syne font-extrabold text-2xl md:text-3xl tracking-wide uppercase">
            {title}
          </h2>
        </div>

        {showSlider ? (
          <div className="relative">
            <Slider {...settings} ref={sliderRef}>
              {products.map((product) => (
                <div key={product.id} className="px-2">
                  <ProductCard product={product} />
                </div>
              ))}
            </Slider>

            <button
              onClick={() => sliderRef.current?.slickPrev()}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5 text-slate-900" />
            </button>
            <button
              onClick={() => sliderRef.current?.slickNext()}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
            >
              <ChevronRight className="h-5 w-5 text-slate-900" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSlider;
