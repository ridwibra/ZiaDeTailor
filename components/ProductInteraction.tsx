"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Headphones, Minus, Plus, Ruler, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { ProductType } from "@/utils/types";
import {
  CartSize,
  CustomMeasurements,
  MeasurementType,
  useStore,
} from "@/store/Store";

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

const HEAD_FIELDS = [
  "Head circumference",
  "Forehead width",
  "Temple to temple",
  "Ear to ear over crown",
  "Crown height",
  "Nape to forehead",
];

const ALL_MEASUREMENT_FIELDS = [
  ...TOP_FIELDS,
  ...BOTTOM_FIELDS,
  ...HEAD_FIELDS,
];

const normalizeMeasurements = (
  measurements: CustomMeasurements,
): CustomMeasurements =>
  Object.fromEntries(
    Object.entries(measurements)
      .map(([field, value]) => [field, value.trim()])
      .filter(([, value]) => value.length > 0),
  );

type ProductWithId = ProductType & {
  _id?: string;
};

function isMeasurementType(value: unknown): value is MeasurementType {
  return value === "top" || value === "bottom" || value === "head";
}

function getFieldsForMeasurementType(type: MeasurementType | null): string[] {
  if (type === "top") {
    return TOP_FIELDS;
  }

  if (type === "bottom") {
    return BOTTOM_FIELDS;
  }

  if (type === "head") {
    return HEAD_FIELDS;
  }

  return [];
}

function removeMeasurementParams(params: URLSearchParams) {
  params.delete("measurementType");

  ALL_MEASUREMENT_FIELDS.forEach((field) => {
    params.delete(field);
  });
}

export default function ProductInteraction({
  product,
  selectedSize,
  selectedColor,
}: {
  product: ProductType;
  selectedSize: string;
  selectedColor: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const addItem = useStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [customMode, setCustomMode] = useState(false);

  const savedMeasurementTypeValue = searchParams.get("measurementType");

  const savedMeasurementType = isMeasurementType(savedMeasurementTypeValue)
    ? savedMeasurementTypeValue
    : null;

  const [measurementType, setMeasurementType] =
    useState<MeasurementType | null>(savedMeasurementType);

  const selectedColorData = useMemo(
    () => product.colors?.find((color) => color.hex === selectedColor),
    [product.colors, selectedColor],
  );

  const selectedStandardSize = useMemo(
    () => product.sizes.find((size) => size.size === selectedSize),
    [product.sizes, selectedSize],
  );

  const selectedPrice =
    selectedStandardSize?.price ?? product.sizes[0]?.price ?? 0;

  const customMeasurementsFromUrl = useMemo(() => {
    const fields = getFieldsForMeasurementType(savedMeasurementType);

    return normalizeMeasurements(
      fields.reduce<CustomMeasurements>((result, field) => {
        const value = searchParams.get(field);

        if (value) {
          result[field] = value;
        }

        return result;
      }, {}),
    );
  }, [savedMeasurementType, searchParams]);

  const [customMeasurements, setCustomMeasurements] =
    useState<CustomMeasurements>(customMeasurementsFromUrl);

  const hasSavedCustomMeasurements =
    savedMeasurementType !== null &&
    Object.keys(customMeasurementsFromUrl).length > 0;

  const handleTypeChange = (type: "size" | "color", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "color" && !value) {
      params.delete("color");
    } else {
      params.set(type, value);
    }

    if (type === "size") {
      removeMeasurementParams(params);
      setCustomMode(false);
      setMeasurementType(null);
      setCustomMeasurements({});
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const clearCustomMeasurements = () => {
    const params = new URLSearchParams(searchParams.toString());

    removeMeasurementParams(params);

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    setCustomMode(false);
    setMeasurementType(null);
    setCustomMeasurements({});

    toast.success("Custom measurements removed.");
  };

  const openCustomMeasurements = () => {
    if (!selectedSize) {
      toast.error("Please select a size before adding measurements.");
      return;
    }

    setCustomMode(true);
    setMeasurementType(savedMeasurementType);
    setCustomMeasurements(customMeasurementsFromUrl);
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      if (quantity >= product.countInStock) {
        toast.error("You cannot add more than the available stock.");
        return;
      }

      setQuantity((previous) => previous + 1);
      return;
    }

    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  };

  const handleMeasurementType = (type: MeasurementType) => {
    setMeasurementType(type);

    const allowedFields = new Set(getFieldsForMeasurementType(type));

    setCustomMeasurements((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([field]) => allowedFields.has(field)),
      ),
    );
  };

  const saveCustomMeasurements = () => {
    if (!selectedSize) {
      toast.error("Please select a size first.");
      return;
    }

    if (!measurementType) {
      toast.error("Please choose top, bottom, or head measurements.");
      return;
    }

    const normalizedMeasurements = normalizeMeasurements(customMeasurements);

    if (Object.keys(normalizedMeasurements).length === 0) {
      toast.error("Please enter at least one custom measurement.");
      return;
    }

    if (
      measurementType === "head" &&
      !normalizedMeasurements["Head circumference"]
    ) {
      toast.error("Head circumference is required for head measurements.");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("size", selectedSize);
    params.set("measurementType", measurementType);

    ALL_MEASUREMENT_FIELDS.forEach((field) => {
      params.delete(field);
    });

    Object.entries(normalizedMeasurements).forEach(([field, value]) => {
      params.set(field, value);
    });

    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });

    setCustomMeasurements(normalizedMeasurements);
    setCustomMode(false);

    toast.success(
      `${measurementType[0].toUpperCase()}${measurementType.slice(
        1,
      )} measurements saved for size ${selectedSize.toUpperCase()}.`,
    );
  };

  const createSizePayload = (): CartSize | null => {
    if (!selectedSize) {
      toast.error("Please select a size.");
      return null;
    }

    if (!hasSavedCustomMeasurements) {
      return {
        label: selectedSize,
        isCustom: false,
      };
    }

    if (!savedMeasurementType) {
      toast.error("Custom measurement type is missing.");
      return null;
    }

    return {
      label: selectedSize,
      isCustom: true,
      measurementType: savedMeasurementType,
      measurements: customMeasurementsFromUrl,
    };
  };

  const handleAddToCart = (): boolean => {
    if (product.countInStock < 1) {
      toast.error("Sorry, this product is out of stock.");
      return false;
    }

    if (quantity > product.countInStock) {
      toast.error("Selected quantity exceeds the available stock.");
      return false;
    }

    const size = createSizePayload();

    if (!size) {
      return false;
    }

    const primaryImage = product.images?.[0];

    if (!primaryImage?.url) {
      toast.error("This product does not have an image available.");
      return false;
    }

    const productId = (product as ProductWithId)._id;

    if (!productId) {
      toast.error("This product is missing its ID. Please refresh the page.");
      return false;
    }

    addItem({
      productId,
      slug: product.slug,
      name: product.name,
      quantity,
      image: {
        url: primaryImage.url,
        public_id: primaryImage.public_id || "",
      },
      price: selectedPrice,
      countInStock: product.countInStock || 0,
      size,
      color: selectedColorData
        ? {
            name: selectedColorData.name,
            hex: selectedColorData.hex,
          }
        : undefined,
    });

    toast.success("Product added to cart.");
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      router.push("/cart");
    }
  };

  const fields = getFieldsForMeasurementType(measurementType);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-300">Size</span>

        {product.sizes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {product.sizes.map((size) => (
              <button
                key={size.size}
                type="button"
                onClick={() => handleTypeChange("size", size.size)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  selectedSize === size.size
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-400"
                }`}
                aria-pressed={selectedSize === size.size}
              >
                {size.size.toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">
            This product currently has no available sizes.
          </p>
        )}
      </div>

      {selectedSize ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <Ruler className="h-4 w-4" />
              </span>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Custom measurements for size {selectedSize.toUpperCase()}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Optional. Use your selected size as the base, then add top,
                  bottom, or head measurements for tailoring.
                </p>
              </div>
            </div>

            {!customMode ? (
              <button
                type="button"
                onClick={openCustomMeasurements}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-teal-600 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-500/10 sm:w-auto"
              >
                <Ruler className="h-4 w-4" />
                {hasSavedCustomMeasurements
                  ? "Edit measurements"
                  : "Add measurements"}
              </button>
            ) : null}
          </div>

          {hasSavedCustomMeasurements && !customMode ? (
            <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  Custom {savedMeasurementType} measurements saved
                </p>

                <button
                  type="button"
                  onClick={clearCustomMeasurements}
                  className="font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  Remove
                </button>
              </div>

              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {Object.entries(customMeasurementsFromUrl).map(
                  ([field, value]) => (
                    <p key={field}>
                      {field}: {value}
                    </p>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {customMode ? (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Choose measurement type
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleMeasurementType("top")}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    measurementType === "top"
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  Top
                </button>

                <button
                  type="button"
                  onClick={() => handleMeasurementType("bottom")}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    measurementType === "bottom"
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  Bottom
                </button>

                <button
                  type="button"
                  onClick={() => handleMeasurementType("head")}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    measurementType === "head"
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  <Headphones className="h-4 w-4" />
                  Head
                </button>
              </div>

              {measurementType === "head" ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Measure head circumference around the widest part of the head,
                  just above the eyebrows and ears. Include the unit, for
                  example: 22 in or 56 cm.
                </p>
              ) : null}

              {measurementType ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                        {field}
                        {measurementType === "head" &&
                        field === "Head circumference"
                          ? " *"
                          : ""}
                      </span>

                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={
                          measurementType === "head" &&
                          field === "Head circumference"
                            ? "e.g. 22 in or 56 cm"
                            : "e.g. 38 in"
                        }
                        value={customMeasurements[field] || ""}
                        onChange={(event) =>
                          setCustomMeasurements((previous) => ({
                            ...previous,
                            [field]: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-teal-400"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Select Top, Bottom, or Head to enter measurements.
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setCustomMode(false);
                    setMeasurementType(savedMeasurementType);
                    setCustomMeasurements(customMeasurementsFromUrl);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveCustomMeasurements}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  <Ruler className="h-4 w-4" />
                  Save measurements
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {product.colors?.length > 0 ? (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-300">
            Color <span className="text-xs">(optional)</span>
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("color", "")}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                !selectedColor
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              }`}
              aria-pressed={!selectedColor}
            >
              No color
            </button>

            {product.colors.map((color) => {
              const isSelected = selectedColor === color.hex;

              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => handleTypeChange("color", color.hex)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full transition focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                  aria-label={`Select ${color.name}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={`absolute inset-0 rounded-full border-2 ${
                      isSelected
                        ? "border-black dark:border-white"
                        : "border-transparent"
                    }`}
                  />

                  <span
                    className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-300">Quantity</span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleQuantityChange("decrement")}
            disabled={quantity <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="text-lg font-medium">{quantity}</span>

          <button
            type="button"
            onClick={() => handleQuantityChange("increment")}
            disabled={quantity >= product.countInStock}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.countInStock} available
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={product.countInStock < 1 || !selectedSize}
        className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        <Plus className="h-4 w-4" />
        {product.countInStock < 1 ? "Out of Stock" : "Add to Cart"}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={product.countInStock < 1 || !selectedSize}
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <ShoppingCart className="h-4 w-4" />
        Buy this Item
      </button>
    </div>
  );
}
