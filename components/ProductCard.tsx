"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductType } from "@/utils/types";
import { useStore } from "@/store/Store";

type ProductWithId = ProductType & {
  _id?: string;
};

export default function ProductCard({ product }: { product: ProductType }) {
  const addItem = useStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[0]?.size || "",
  );

  // Color selection is optional.
  const [selectedColor, setSelectedColor] = useState("");

  const primaryImage = product.images?.[0];

  const selectedSizeData = useMemo(
    () => product.sizes?.find((size) => size.size === selectedSize),
    [product.sizes, selectedSize],
  );

  const selectedColorData = useMemo(
    () => product.colors?.find((color) => color.hex === selectedColor),
    [product.colors, selectedColor],
  );

  const selectedPrice =
    selectedSizeData?.price ?? product.sizes?.[0]?.price ?? 0;

  const handleAddToCart = () => {
    if (product.countInStock < 1) {
      toast.error("Sorry, this product is out of stock.");
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size.");
      return;
    }

    if (!primaryImage?.url) {
      toast.error("This product does not have an image available.");
      return;
    }

    const productId = (product as ProductWithId)._id;

    if (!productId) {
      toast.error("This product is missing its ID.");
      return;
    }

    addItem({
      productId,
      slug: product.slug,
      name: product.name,
      quantity: 1,
      image: {
        url: primaryImage.url,
        public_id: primaryImage.public_id || "",
      },
      price: selectedPrice,
      countInStock: product.countInStock || 0,
      size: {
        label: selectedSize,
        isCustom: false,
      },
      color: selectedColorData
        ? {
            name: selectedColorData.name,
            hex: selectedColorData.hex,
          }
        : undefined,
    });

    toast.success("Product added to cart.");
  };

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-300">
              No image available
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h2 className="font-medium text-gray-900 dark:text-gray-100">
            {product.name}
          </h2>

          <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {product.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`size-${product.slug}`}
              className="text-gray-500 dark:text-gray-300"
            >
              Size
            </label>

            <select
              id={`size-${product.slug}`}
              value={selectedSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              disabled={!product.sizes?.length}
              className="rounded-md bg-white px-2 py-1 text-gray-900 ring-1 ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600"
            >
              {product.sizes?.length ? (
                product.sizes.map((size) => (
                  <option key={size.size} value={size.size}>
                    {size.size.toUpperCase()}
                  </option>
                ))
              ) : (
                <option value="">No sizes available</option>
              )}
            </select>
          </div>

          {product.colors?.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 dark:text-gray-300">
                Color <span className="text-[10px]">(optional)</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColor("")}
                  className={`rounded-md border px-2 py-1 text-[10px] transition ${
                    !selectedColor
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  aria-pressed={!selectedColor}
                >
                  None
                </button>

                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.hex;

                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setSelectedColor(color.hex)}
                      className={`relative flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 ${
                        isSelected ? "scale-110" : "scale-100"
                      }`}
                      aria-label={`Select ${color.name}`}
                      aria-pressed={isSelected}
                      title={color.name}
                    >
                      <span
                        className={`absolute inset-0 rounded-full border-2 ${
                          isSelected
                            ? "border-gray-700 dark:border-gray-300"
                            : "border-transparent"
                        }`}
                      />

                      <span
                        className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            ${selectedPrice.toFixed(2)}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.countInStock < 1 || !selectedSize}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white dark:hover:text-black"
          >
            <ShoppingCart className="h-4 w-4" />
            {product.countInStock < 1 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
