"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { ProductImage } from "@/types/product";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ProductImagesProps {
  images: ProductImage[];
  productName: string;
  isInStock: boolean;
}

export default function ProductImages({ images, productName, isInStock }: ProductImagesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const mainSliderRef = useRef<Slider | null>(null);
  const thumbSliderRef = useRef<Slider | null>(null);

  const mainSettings = {
    dots: false,
    infinite: images.length > 1,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: false,
    afterChange: (index: number) => {
      setCurrentSlide(index);
      thumbSliderRef.current?.slickGoTo(index);
    },
  };

  const thumbSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: Math.min(images.length, 4),
    slidesToScroll: 1,
    arrows: false,
    focusOnSelect: true,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 768,
        settings: { slidesToShow: 3 },
      },
    ],
  };

  const handleThumbClick = (index: number) => {
    mainSliderRef.current?.slickGoTo(index);
  };

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-white border-4 border-black overflow-hidden">
        <div className="flex items-center justify-center h-full font-syne text-8xl font-bold text-zinc-100">
          {productName.charAt(0)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Slider */}
      <div className="relative aspect-square bg-white border-4 border-black overflow-hidden group">
        <Slider ref={mainSliderRef} {...mainSettings}>
          {images.map((img) => (
            <div key={img.id} className="aspect-square">
              <div className="relative w-full h-full">
                <Image
                  src={img.url}
                  alt={img.altText || productName}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          ))}
        </Slider>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => mainSliderRef.current?.slickPrev()}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => mainSliderRef.current?.slickNext()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Slide Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white font-space text-xs px-2 py-1 z-10">
            {currentSlide + 1} / {images.length}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center">
              <X size={48} className="mx-auto mb-4 text-red-500" />
              <span className="font-space text-white text-sm font-bold">OUT OF STOCK</span>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Slider */}
      {images.length > 1 && (
        <div className="relative">
          <Slider ref={thumbSliderRef} {...thumbSettings}>
            {images.map((img, index) => (
              <div key={img.id} className="px-1">
                <button
                  onClick={() => handleThumbClick(index)}
                  className={`aspect-square bg-white border-2 w-full overflow-hidden transition-colors ${
                    currentSlide === index ? "border-black" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${productName} ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain p-1"
                  />
                </button>
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
}
