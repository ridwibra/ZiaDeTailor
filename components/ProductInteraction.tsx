"use client";

import { ProductType } from "@/utils/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/store/Store";

const TOP_FIELDS = [
  "Dress length",
  "Across back",
  "Chest",
  "Sleeve length",
  "Around arm",
  "Around sleeve cuff",
  "Around neck",
  "Shoulder to belly",
  "Around belly",
  "Waist",
  "Hip",
];

const BOTTOM_FIELDS = [
  "Trouser length",
  "Waist",
  "Hip",
  "Waist to knee",
  "Waist to cuff",
  "Thigh",
  "Around knee",
  "Around cuff",
  "Leg opening",
  "Inseam",
  "Crotch length / Depth",
];

const ProductInteraction = ({
  product,
  selectedSize,
  selectedColor,
}: {
  product: ProductType;
  selectedSize: string;
  selectedColor: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [quantity, setQuantity] = useState(1);

  const [customMode, setCustomMode] = useState(false);

  // user chooses top or bottom
  const [measurementType, setMeasurementType] = useState<
    "top" | "bottom" | null
  >(null);

  // store custom measurement values
  const [customMeasurements, setCustomMeasurements] = useState<
    Record<string, string>
  >({});
  const { dispatch } = useStore();

  const handleTypeChange = (type: "size" | "color", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(type, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") setQuantity((prev) => prev + 1);
    else if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const saveCustomMeasurements = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", "custom");

    Object.entries(customMeasurements).forEach(([key, value]) => {
      params.set(key, value);
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCustomMode(false);
  };

  const fields =
    measurementType === "top"
      ? TOP_FIELDS
      : measurementType === "bottom"
        ? BOTTOM_FIELDS
        : [];

  // ⭐ ADD TO CART — now includes custom measurements
  const handleAddToCart = () => {
    dispatch({
      type: "CART_ADD_ITEM",
      payload: {
        slug: product.slug,
        name: product.name,
        quantity,
        image: product.images?.[0]?.url || "",
        price:
          product.sizes.find((s) => s.size === selectedSize)?.price ||
          product.sizes[0]?.price ||
          0,
        countInStock: product.countInStock || 0,
      },
    });
  };

  // ⭐ BUY NOW — also includes custom measurements
  const handleBuyNow = () => {
    const payload = {
      ...product,
      quantity,
      selectedColor,
      selectedSize,
      customMeasurements: selectedSize === "custom" ? customMeasurements : null,
    };

    console.log("BUY NOW PAYLOAD:", payload);

    // buyNow(payload);
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* SIZE */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-300">Size</span>

        <div className="flex items-center gap-3 flex-wrap">
          {product.sizes.map((s) => (
            <button
              key={s.size}
              onClick={() => {
                setCustomMode(false);
                setMeasurementType(null);
                handleTypeChange("size", s.size);
              }}
              className={`
                px-3 py-2 rounded-md border text-sm font-medium transition
                ${
                  selectedSize === s.size
                    ? "bg-black text-white border-black"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                }
              `}
            >
              {s.size.toUpperCase()}
            </button>
          ))}

          {/* CUSTOM BUTTON */}
          <button
            onClick={() => {
              setCustomMode(true);
              setMeasurementType(null);
              handleTypeChange("size", "custom");
            }}
            className={`
              px-3 py-2 rounded-md border text-sm font-medium transition
              ${
                selectedSize === "custom"
                  ? "bg-black text-white border-black"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              }
            `}
          >
            Custom
          </button>
        </div>

        {/* CUSTOM FORM */}
        {customMode && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col gap-4">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Choose measurement type
            </span>

            {/* TOP / BOTTOM SELECTOR */}
            <div className="flex gap-3">
              <button
                onClick={() => setMeasurementType("top")}
                className={`
                  px-3 py-2 rounded-md border text-sm transition
                  ${
                    measurementType === "top"
                      ? "bg-black text-white border-black"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                  }
                `}
              >
                Top
              </button>

              <button
                onClick={() => setMeasurementType("bottom")}
                className={`
                  px-3 py-2 rounded-md border text-sm transition
                  ${
                    measurementType === "bottom"
                      ? "bg-black text-white border-black"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                  }
                `}
              >
                Bottom
              </button>
            </div>

            {/* SHOW FIELDS */}
            {measurementType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field}
                    value={customMeasurements[field] || ""}
                    onChange={(e) =>
                      setCustomMeasurements({
                        ...customMeasurements,
                        [field]: e.target.value,
                      })
                    }
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                ))}
              </div>
            )}

            <button
              onClick={saveCustomMeasurements}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Save Measurements
            </button>
          </div>
        )}
      </div>

      {/* COLOR */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-300">Color</span>
        <div className="flex items-center gap-3 flex-wrap">
          {product.colors.map((c) => {
            const isSelected = selectedColor === c.hex;

            return (
              <button
                key={c.hex}
                onClick={() => handleTypeChange("color", c.hex)}
                className="relative w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <span
                  className={`
                    absolute inset-0 rounded-full border-2
                    ${isSelected ? "border-black dark:border-white" : "border-transparent"}
                  `}
                />
                <span
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* QUANTITY */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-300">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange("decrement")}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-lg font-medium">{quantity}</span>

          <button
            onClick={() => handleQuantityChange("increment")}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ADD TO CART */}
      <button
        onClick={handleAddToCart}
        className="bg-black text-white px-5 py-3 rounded-lg shadow-md flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-900 transition"
      >
        <Plus className="w-4 h-4" />
        Add to Cart
      </button>

      {/* BUY NOW */}
      <button
        onClick={handleBuyNow}
        className="border border-gray-300 dark:border-gray-600 px-5 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <ShoppingCart className="w-4 h-4" />
        Buy this Item
      </button>
    </div>
  );
};

export default ProductInteraction;
