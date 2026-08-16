"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Ruler, Truck } from "lucide-react";
import { toast } from "sonner";

import CheckoutWizard from "@/components/CheckoutWizard";
import PayPalPayment from "@/components/PayPalPayment";
import {
  CartItem,
  getCartItemKey,
  PaymentMethod,
  useStore,
} from "@/store/Store";

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getSizeLabel(item: CartItem) {
  const baseSize = item.size.label || "-";

  if (!item.size.isCustom) {
    return baseSize;
  }

  const measurementCount = Object.keys(item.size.measurements ?? {}).length;

  const measurementType = item.size.measurementType
    ? ` ${item.size.measurementType}`
    : "";

  return measurementCount > 0
    ? `${baseSize} · Custom${measurementType} measurements (${measurementCount})`
    : `${baseSize} · Custom measurements`;
}

export default function PlaceOrderScreen() {
  const router = useRouter();

  const cartItems = useStore((state) => state.cartItems);
  const shippingAddress = useStore((state) => state.shippingAddress);
  const shippingRate = useStore((state) => state.shippingRate);
  const paymentMethod = useStore((state) => state.paymentMethod);
  const savePaymentMethod = useStore((state) => state.savePaymentMethod);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    Exclude<PaymentMethod, "">
  >(
    paymentMethod === "paypal" || paymentMethod === "card"
      ? paymentMethod
      : "paypal",
  );

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = useMemo(() => {
    const itemTotal = round2(
      cartItems.reduce((total, item) => total + item.quantity * item.price, 0),
    );

    const shipping = round2(shippingRate?.price ?? 0);
    const tax = 0;

    return {
      itemsPrice: itemTotal,
      shippingPrice: shipping,
      taxPrice: tax,
      totalPrice: round2(itemTotal + shipping + tax),
    };
  }, [cartItems, shippingRate?.price]);

  useEffect(() => {
    const hasShippingAddress =
      Boolean(shippingAddress.fullName?.trim()) &&
      Boolean(shippingAddress.street?.trim()) &&
      Boolean(shippingAddress.city?.trim()) &&
      Boolean(shippingAddress.state?.trim()) &&
      Boolean(shippingAddress.postalCode?.trim()) &&
      Boolean(shippingAddress.country?.trim()) &&
      Boolean(shippingAddress.phone?.trim());

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      router.replace("/cart");
      return;
    }

    if (!hasShippingAddress) {
      toast.error("Please provide your shipping address first.");
      router.replace("/shipping");
      return;
    }

    if (!shippingRate?._id) {
      toast.error("Please choose a shipping rate first.");
      router.replace("/shipping");
    }
  }, [
    cartItems.length,
    router,
    shippingAddress.city,
    shippingAddress.country,
    shippingAddress.fullName,
    shippingAddress.phone,
    shippingAddress.postalCode,
    shippingAddress.state,
    shippingAddress.street,
    shippingRate?._id,
  ]);

  function choosePaymentMethod(method: Exclude<PaymentMethod, "">) {
    setSelectedPaymentMethod(method);
    savePaymentMethod(method);
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-8 pt-24 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-screen-xl">
          <CheckoutWizard activeStep={2} />

          <h1 className="mb-4 mt-6 text-xl font-semibold">Review Order</h1>

          <p>
            Cart is empty.{" "}
            <Link
              href="/products"
              className="font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
            >
              Go shopping
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-8 pt-24 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-screen-xl">
        <CheckoutWizard activeStep={2} />

        <h1 className="mb-6 mt-6 text-2xl font-semibold tracking-tight">
          Review Order
        </h1>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-4 md:col-span-3">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Shipping Address</h2>

                  <address className="mt-3 not-italic text-sm leading-6 text-gray-700 dark:text-gray-300">
                    <p>{shippingAddress.fullName}</p>
                    <p>{shippingAddress.street}</p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.state}{" "}
                      {shippingAddress.postalCode}
                    </p>
                    <p>{shippingAddress.country}</p>
                    <p className="mt-1">Phone: {shippingAddress.phone}</p>
                  </address>
                </div>

                <Link
                  href="/shipping"
                  className="shrink-0 text-sm font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
                >
                  Edit
                </Link>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Shipping Option</h2>

                  {shippingRate ? (
                    <div className="mt-3 flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <MapPin className="h-4 w-4" />
                      </span>

                      <div>
                        <p className="font-medium">{shippingRate.place}</p>

                        {shippingRate.carrier ? (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <Truck className="h-3.5 w-3.5" />
                            {shippingRate.carrier}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(shippingPrice)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      No shipping option selected.
                    </p>
                  )}
                </div>

                <Link
                  href="/shipping"
                  className="shrink-0 text-sm font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
                >
                  Edit
                </Link>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold">Payment Method</h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Both payment options are processed securely by PayPal.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    selectedPaymentMethod === "paypal"
                      ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPaymentMethod === "paypal"}
                    onChange={() => choosePaymentMethod("paypal")}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span>
                    <span className="inline-flex rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                      PayPal
                    </span>

                    <span className="mt-2 block text-sm font-semibold">
                      Pay with PayPal
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Sign in to PayPal to approve your payment.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    selectedPaymentMethod === "card"
                      ? "border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-500/10"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={selectedPaymentMethod === "card"}
                    onChange={() => choosePaymentMethod("card")}
                    className="mt-1 h-4 w-4 accent-teal-600"
                  />

                  <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />

                  <span>
                    <span className="block text-sm font-semibold">
                      Debit / Credit Card
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Enter card details securely through PayPal.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Order Items</h2>

                <Link
                  href="/cart"
                  className="text-sm font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
                >
                  Edit cart
                </Link>
              </div>

              <table className="mt-4 min-w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-semibold">
                      Item
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-semibold">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-semibold">
                      Price
                    </th>
                    <th className="px-3 py-3 text-right text-sm font-semibold">
                      Subtotal
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {cartItems.map((item) => (
                    <tr
                      key={getCartItemKey(item)}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="py-4 pr-3">
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

                          <div>
                            <p className="font-medium">{item.name}</p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              {item.size.isCustom ? (
                                <Ruler className="h-3 w-3" />
                              ) : null}
                              Size: {getSizeLabel(item)}
                              {item.color ? ` · Color: ${item.color.name}` : ""}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="px-3 py-4 text-right">{item.quantity}</td>

                      <td className="px-3 py-4 text-right">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="px-3 py-4 text-right font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:sticky md:top-24">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">Items</span>
                <span>{formatCurrency(itemsPrice)}</span>
              </li>

              <li className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">
                  Shipping
                </span>
                <span>{formatCurrency(shippingPrice)}</span>
              </li>

              {taxPrice > 0 ? (
                <li className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span>{formatCurrency(taxPrice)}</span>
                </li>
              ) : null}

              <li className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base font-semibold dark:border-gray-700">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </li>

              <li className="pt-3">
                {!shippingRate?._id ? (
                  <Link
                    href="/shipping"
                    className="block rounded-md bg-black px-4 py-3 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Select shipping to continue
                  </Link>
                ) : (
                  <PayPalPayment
                    cartItems={cartItems}
                    shippingAddress={shippingAddress}
                    shippingRateId={shippingRate._id}
                    paymentMethod={selectedPaymentMethod}
                  />
                )}
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
