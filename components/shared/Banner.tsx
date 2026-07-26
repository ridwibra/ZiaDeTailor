"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function HomeBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banner", {
          headers: { Accept: "application/json" },
        });

        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText || `Failed to load banners (${res.status})`,
          );
        }

        if (!contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON, got: ${text.slice(0, 80)}`);
        }

        const data = await res.json();

        if (data.banners) {
          const sorted = data.banners
            .filter((b: any) => b.active !== false)
            .sort((a: any, b: any) => {
              const aHasOrder = typeof a.order === "number";
              const bHasOrder = typeof b.order === "number";

              if (aHasOrder && bHasOrder) return a.order - b.order;
              if (aHasOrder) return -1;
              if (bHasOrder) return 1;

              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            });

          setBanners(sorted);
        }
      } catch (err) {
        console.error("Failed to load banners:", err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center">
        <p className="text-gray-500">Loading banners...</p>
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center">
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl overflow-hidden"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div className="relative w-full h-full">
              <Image
                src={banner.image.url}
                alt={banner.title}
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white px-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  {banner.title}
                </h2>

                {banner.subtitle && (
                  <p className="text-lg sm:text-xl md:text-2xl">
                    {banner.subtitle}
                  </p>
                )}

                {banner.link && (
                  <Link
                    href={banner.link}
                    className="mt-4 inline-block bg-white text-black font-semibold px-6 py-2 rounded-md shadow hover:bg-gray-200 transition"
                  >
                    Explore Now
                  </Link>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
