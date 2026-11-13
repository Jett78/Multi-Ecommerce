"use client";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/types/banner";

const HeroBannerSlider = ({ banners }: { banners: Banner[] }) => {
  const sliderRef = useRef<Slider | null>(null);

  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 800,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false,
    fade: false,
    cssEase: "linear",
  };

  return (
    <div className="relative w-full  mt-10">
      <Slider {...settings} ref={sliderRef}>
        {banners.map((banner) => (
          <div key={banner.id} className="relative h-[200px] w-full sm:h-[320px]  md:h-[380px] lg:h-[450px]">
            {banner.link ? (
              <Link href={banner.link} className="block h-full w-full">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className=""
                  priority
                />
              </Link>
            ) : (
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className=""
                priority
              />
            )}
          </div>
        ))}
      </Slider>

      {/* Custom Arrows */}
      <button
        onClick={() => sliderRef.current?.slickPrev()}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-white/90 border border-white/20 p-2.5 transition-colors hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5 text-primarymain" />
      </button>
      <button
        onClick={() => sliderRef.current?.slickNext()}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-white/90 border border-white/20 p-2.5 transition-colors hover:bg-white"
      >
        <ChevronRight className="h-5 w-5 text-primarymain" />
      </button>
    </div>
  );
};

export default HeroBannerSlider;
