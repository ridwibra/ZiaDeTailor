"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

type Banner = {
  _id: string;
  title: string;
  subtitle?: string;
  link?: string;
  active?: boolean;
  order?: number;
  createdAt: string;
  image: {
    url: string;
  };
};

export default function HomeBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banner", {
          headers: {
            Accept: "application/json",
          },
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

        if (data.banners && Array.isArray(data.banners)) {
          const sorted = data.banners
            .filter((banner: Banner) => banner.active !== false)
            .sort((a: Banner, b: Banner) => {
              const aHasOrder = typeof a.order === "number";
              const bHasOrder = typeof b.order === "number";

              if (aHasOrder && bHasOrder) {
                return a.order! - b.order!;
              }

              if (aHasOrder) return -1;
              if (bHasOrder) return 1;

              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            });

          setBanners(sorted);
        } else {
          setBanners([]);
        }
      } catch (error) {
        console.error("Failed to load banners:", error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] items-center justify-center rounded-xl bg-gray-100">
        <p className="text-gray-500">Loading banners...</p>
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="flex w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] items-center justify-center rounded-xl bg-gray-100">
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }

  return (
    <section className="w-full">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation
        loop={banners.length > 1}
        className="w-full aspect-[16/9] overflow-hidden rounded-xl bg-black sm:aspect-[2/1] lg:aspect-[21/9]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div className="relative h-full w-full bg-black">
              <Image
                src={banner.image.url}
                alt={banner.title || "Banner image"}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4 text-center text-white">
                <h2 className="mb-2 text-3xl font-bold sm:text-4xl md:text-5xl">
                  {banner.title}
                </h2>

                {banner.subtitle && (
                  <p className="max-w-3xl text-lg sm:text-xl md:text-2xl">
                    {banner.subtitle}
                  </p>
                )}

                {banner.link && (
                  <Link
                    href={banner.link}
                    className="mt-4 inline-block rounded-md bg-white px-6 py-2 font-semibold text-black shadow transition hover:bg-gray-200"
                  >
                    Explore Now
                  </Link>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
