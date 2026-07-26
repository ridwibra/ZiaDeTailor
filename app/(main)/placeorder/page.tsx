"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "@/store/Store";
import CheckoutWizard from "@/components/CheckoutWizard";

export default function PlaceOrderScreen() {
  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { cartItems, shippingAddress, paymentMethod } = cart;

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const round2 = (num: number) => Math.round(num * 100 + Number.EPSILON) / 100;

  const itemsPrice = round2(
    cartItems.reduce((a, c) => a + c.quantity * c.price, 0),
  );

  const shippingPrice = itemsPrice > 200 ? 0 : 15;
  const taxPrice = round2(itemsPrice * 0.15);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  useEffect(() => {
    if (!paymentMethod) {
      router.push("/payment");
    }
  }, [paymentMethod, router]);

  const placeOrderHandler = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItems: cartItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to place order");
      }

      dispatch({ type: "CART_CLEAR_ITEMS" });
      router.push(`/order/${data._id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 mx-auto max-w-screen-xl px-4 py-8">
      <CheckoutWizard activeStep={3} />

      <h1 className="mb-4 text-xl font-semibold">Place Order</h1>

      {cartItems.length === 0 ? (
        <div>
          Cart is empty. <Link href="/">Go shopping</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-4 md:col-span-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Shipping Address</h2>
              <div className="text-sm text-gray-700">
                {shippingAddress.fullName}, {shippingAddress.address},{" "}
                {shippingAddress.city}, {shippingAddress.postalCode},{" "}
                {shippingAddress.country}
              </div>
              <div className="mt-2">
                <Link
                  href="/shipping"
                  className="text-sm text-blue-600 underline"
                >
                  Edit
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Payment Method</h2>
              <div className="text-sm text-gray-700">
                {paymentMethod === "cod"
                  ? "Pay on Delivery"
                  : "Debit / Credit Card"}
              </div>
              <div className="mt-2">
                <Link
                  href="/payment"
                  className="text-sm text-blue-600 underline"
                >
                  Edit
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Order Items</h2>

              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 py-3 text-left">Item</th>
                    <th className="px-5 py-3 text-right">Quantity</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item: any) => (
                    <tr
                      key={`${item.slug}-${item.size || ""}-${item.color || ""}`}
                      className="border-b"
                    >
                      <td className="py-4">
                        <Link
                          href={`/products/${item.slug}`}
                          className="flex items-center gap-3"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                            className="rounded-md object-cover"
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.size ? `Size: ${item.size}` : ""}
                              {item.size && item.color ? " • " : ""}
                              {item.color ? `Color: ${item.color}` : ""}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-right">{item.quantity}</td>
                      <td className="px-5 py-4 text-right">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2">
                <Link href="/cart" className="text-sm text-blue-600 underline">
                  Edit
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Order Summary</h2>

              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Items</span>
                  <span>${itemsPrice.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Tax</span>
                  <span>${taxPrice.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shippingPrice.toFixed(2)}</span>
                </li>
                <li className="flex justify-between border-t pt-3 font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </li>
                <li className="pt-2">
                  <button
                    disabled={loading}
                    onClick={placeOrderHandler}
                    className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Loading..." : "Place Order"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PlaceOrderScreen.auth = true;
