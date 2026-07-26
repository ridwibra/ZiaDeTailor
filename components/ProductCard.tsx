"use client";

import { ProductType } from "@/utils/types";
// import useCartStore from "@/stores/cartStore";

import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/store/Store";

const ProductCard = ({ product }: { product: ProductType }) => {
  const [productTypes, setProductTypes] = useState({
    size: product.sizes[0]?.size,
    color: product.colors[0]?.hex,
  });
  const { dispatch } = useStore();

  //   const { addToCart } = useCartStore();

  const handleProductType = ({
    type,
    value,
  }: {
    type: "size" | "color";
    value: string;
  }) => {
    setProductTypes((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const selectedSizePrice =
    product.sizes.find((s) => s.size === productTypes.size)?.price ??
    product.sizes[0]?.price;

  const handleAddToCart = () => {
    dispatch({
      type: "CART_ADD_ITEM",
      payload: {
        slug: product.slug,
        name: product.name,
        quantity: 1,
        image: product.images?.[0]?.url || "",
        price: selectedSizePrice || 0,
        countInStock: product.countInStock || 0,
      },
    });
  };

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      {/* IMAGE */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square">
          <Image
            src={product.images[0]?.url}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-all duration-300"
          />
        </div>
      </Link>

      {/* PRODUCT DETAIL */}
      <div className="flex flex-col gap-4 p-4">
        <h1 className="font-medium">{product.name}</h1>
        <p className="text-sm text-gray-500">{product.description}</p>

        {/* PRODUCT TYPES */}
        <div className="flex items-center gap-4 text-xs">
          {/* SIZES */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Size</span>
            <select
              name="size"
              id="size"
              className="ring ring-gray-300 dark:ring-gray-600 rounded-md px-2 py-1 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              onChange={(e) =>
                handleProductType({ type: "size", value: e.target.value })
              }
            >
              {product.sizes.map((s) => (
                <option key={s.size} value={s.size}>
                  {s.size.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* COLORS */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 dark:text-gray-300">Color</span>
            <div className="flex items-center gap-2">
              {product.colors.map((c) => {
                const isSelected = productTypes.color === c.hex;

                return (
                  <button
                    key={c.hex}
                    onClick={() =>
                      handleProductType({ type: "color", value: c.hex })
                    }
                    className={`
            relative w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-200
            ${isSelected ? "scale-110" : "scale-100"}
          `}
                  >
                    {/* Outer ring for selected color */}
                    <span
                      className={`
              absolute inset-0 rounded-full border-2
              ${
                isSelected
                  ? "border-gray-700 dark:border-gray-300"
                  : "border-transparent"
              }
            `}
                    />

                    {/* Color dot with guaranteed visibility */}
                    <span
                      className={`
              w-4 h-4 rounded-full border 
              border-gray-300 dark:border-gray-600
            `}
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PRICE AND ADD TO CART BUTTON */}
        <div className="flex items-center justify-between">
          <p className="font-medium">${selectedSizePrice.toFixed(2)}</p>

          <button
            onClick={handleAddToCart}
            className="ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-300 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
