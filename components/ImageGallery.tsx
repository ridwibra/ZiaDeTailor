"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryImage = {
  url: string;
  public_id: string;
};

export default function ProductImageGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [activeImage, setActiveImage] = useState(images[0]?.url || "");

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={name}
            width={1600}
            height={2000}
            priority
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="h-auto w-full"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No image available
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.public_id || `${image.url}-${index}`}
              type="button"
              onClick={() => setActiveImage(image.url)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                activeImage === image.url
                  ? "border-black ring-2 ring-black dark:border-white dark:ring-white"
                  : "border-gray-300 hover:border-black dark:border-gray-700 dark:hover:border-white"
              }`}
              aria-label={`View ${name} image ${index + 1}`}
              aria-pressed={activeImage === image.url}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
