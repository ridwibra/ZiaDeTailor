"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductImageGallery({
  images,
  name,
}: {
  images: { url: string; public_id: string }[];
  name: string;
}) {
  const [activeImage, setActiveImage] = useState(images[0]?.url || "");

  return (
    <div className="w-full">
      <div className="relative h-[80vw] max-h-[520px] lg:aspect-square lg:h-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={name}
            fill
            priority
            className="object-cover transition-all duration-300"
          />
        ) : null}
      </div>

      <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
        {images.map((img) => (
          <button
            key={img.public_id}
            type="button"
            onClick={() => setActiveImage(img.url)}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border transition shrink-0 ${
              activeImage === img.url
                ? "border-black ring-2 ring-black"
                : "border-gray-300 hover:border-black"
            }`}
          >
            <Image
              src={img.url}
              alt={`${name} thumbnail`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
