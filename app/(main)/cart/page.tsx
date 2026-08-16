"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { CircleX, Minus, Plus, Ruler } from "lucide-react";
import { toast } from "sonner";

import { CartItem, getCartItemKey, useStore } from "@/store/Store";

function getSizeLabel(item: CartItem) {
  const baseSize = item.size.label || "-";

  if (!item.size.isCustom) {
    return baseSize;
  }

  const measurementCount = Object.keys(item.size.measurements ?? {}).length;

  if (baseSize.toLowerCase() === "custom size") {
    return measurementCount > 0
      ? `Custom ${item.size.measurementType ?? ""} measurements (${measurementCount})`
      : "Custom size";
  }

  const measurementType = item.size.measurementType
    ? ` ${item.size.measurementType}`
    : "";

  const customDescription =
    measurementCount > 0
      ? `Custom${measurementType} measurements (${measurementCount})`
      : "Custom measurements";

  return `${baseSize} · ${customDescription}`;
}

function CartSummary({
  itemCount,
  subtotal,
  onCheckout,
}: {
  itemCount: number;
  subtotal: number;
  onCheckout: () => void;
}) {
  return (
    <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Order summary
        </p>

        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
          Subtotal ({itemCount}): ${subtotal.toFixed(2)}
        </p>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-4 w-full rounded-md bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-500/20 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        Check out
      </button>
    </aside>
  );
}

function CustomMeasurementBadge({ item }: { item: CartItem }) {
  if (!item.size.isCustom) {
    return null;
  }

  const count = Object.keys(item.size.measurements ?? {}).length;

  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
      <Ruler className="h-3 w-3" />
      {count > 0
        ? `${count} custom measurement${count === 1 ? "" : "s"}`
        : "Custom measurements"}
    </span>
  );
}

export default function CartPage() {
  const router = useRouter();

  const cartItems = useStore((state) => state.cartItems);
  const removeItem = useStore((state) => state.removeItem);
  const updateItemQuantity = useStore((state) => state.updateItemQuantity);

  const { itemCount, subtotal } = useMemo(
    () =>
      cartItems.reduce(
        (totals, item) => ({
          itemCount: totals.itemCount + item.quantity,
          subtotal: totals.subtotal + item.quantity * item.price,
        }),
        { itemCount: 0, subtotal: 0 },
      ),
    [cartItems],
  );

  function removeItemHandler(item: CartItem) {
    removeItem(item);
    toast.success("Product removed from cart.");
  }

  function updateQuantity(item: CartItem, direction: "inc" | "dec") {
    const nextQuantity =
      direction === "inc" ? item.quantity + 1 : item.quantity - 1;

    if (nextQuantity < 1) {
      return;
    }

    if (nextQuantity > item.countInStock) {
      toast.error("You cannot add more than the available stock.");
      return;
    }

    updateItemQuantity(item, nextQuantity);
  }

  function goToCheckout() {
    router.push("/shipping");
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-8 pt-24 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 sm:pt-28 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>

          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Your cart is empty.{" "}
            <Link
              href="/products"
              className="font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              Continue shopping
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-8 pt-24 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 sm:pt-28 lg:px-12 lg:pt-32">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Shopping Cart
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-4 md:gap-5 lg:gap-7">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 md:col-span-3">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <tr>
                  <th className="p-5 text-left text-sm font-semibold">Item</th>
                  <th className="p-5 text-left text-sm font-semibold">Size</th>
                  <th className="p-5 text-left text-sm font-semibold">Color</th>
                  <th className="p-5 text-right text-sm font-semibold">
                    Quantity
                  </th>
                  <th className="p-5 text-right text-sm font-semibold">
                    Price
                  </th>
                  <th className="p-5 text-center text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {cartItems.map((item) => (
                  <tr
                    key={getCartItemKey(item)}
                    className="border-b border-gray-200 last:border-0 dark:border-gray-700"
                  >
                    <td className="p-5">
                      <Link
                        href={`/products/${item.slug}`}
                        className="flex min-w-[180px] items-center gap-3"
                      >
                        <Image
                          src={item.image.url}
                          alt={item.name}
                          width={50}
                          height={50}
                          className="h-[50px] w-[50px] rounded-md object-cover"
                        />

                        <span className="font-medium transition hover:text-teal-700 dark:hover:text-teal-300">
                          {item.name}
                        </span>
                      </Link>
                    </td>

                    <td className="p-5">
                      <span className="text-sm">{getSizeLabel(item)}</span>

                      <CustomMeasurementBadge item={item} />
                    </td>

                    <td className="p-5">
                      {item.color ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: item.color.hex }}
                            title={item.color.name}
                          />

                          <span className="text-sm">{item.color.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Not selected
                        </span>
                      )}
                    </td>

                    <td className="p-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, "dec")}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="min-w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item, "inc")}
                          disabled={item.quantity >= item.countInStock}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                    <td className="p-5 text-right font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>

                    <td className="p-5 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemHandler(item)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-gray-600 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <CircleX className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CartSummary
            itemCount={itemCount}
            subtotal={subtotal}
            onCheckout={goToCheckout}
          />
        </div>

        <div className="grid gap-4 md:hidden">
          {cartItems.map((item) => (
            <article
              key={getCartItemKey(item)}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex gap-3">
                <Link href={`/products/${item.slug}`} className="shrink-0">
                  <Image
                    src={item.image.url}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`}>
                    <h2 className="font-semibold leading-tight transition hover:text-teal-700 dark:hover:text-teal-300">
                      {item.name}
                    </h2>
                  </Link>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Size: {getSizeLabel(item)}
                  </p>

                  <CustomMeasurementBadge item={item} />

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Color:
                    </span>

                    {item.color ? (
                      <>
                        <span
                          className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: item.color.hex }}
                          title={item.color.name}
                        />

                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.color.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Not selected
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItemHandler(item)}
                  className="shrink-0 text-gray-600 transition hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <CircleX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                <span className="text-sm font-semibold">Quantity</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, "dec")}
                    disabled={item.quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="min-w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(item, "inc")}
                    disabled={item.quantity >= item.countInStock}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          <CartSummary
            itemCount={itemCount}
            subtotal={subtotal}
            onCheckout={goToCheckout}
          />
        </div>
      </div>
    </main>
  );
}
