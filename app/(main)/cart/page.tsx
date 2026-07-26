"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleX, Minus, Plus } from "lucide-react";
import { Store } from "@/store/Store";

type CartItem = {
  slug: string;
  name: string;
  quantity: number;
  image: string;
  price: number;
  countInStock: number;
  size?: string;
  color?: string;
};

export default function CartPage() {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const { cartItems } = state.cart;

  const removeItemHandler = (item: CartItem) => {
    dispatch({ type: "CART_REMOVE_ITEM", payload: item });
    toast.success("Product removed from cart");
  };

  const updateCartHandler = async (
    item: CartItem,
    updates: Partial<CartItem>,
  ) => {
    const quantity = updates.quantity ?? item.quantity;
    const size = updates.size ?? item.size;

    const res = await fetch(`/api/product/${item.slug}`);
    if (!res.ok) {
      toast.error("Unable to update item");
      return;
    }

    const data = await res.json();
    const product = data.product;

    const stock = product?.countInStock ?? item.countInStock ?? 0;

    if (stock < quantity) {
      toast.error("Sorry. Product is out of stock");
      return;
    }

    const nextPrice = size
      ? (product?.sizes?.find((s: any) => s.size === size)?.price ?? item.price)
      : item.price;

    dispatch({
      type: "CART_ADD_ITEM",
      payload: {
        ...item,
        ...updates,
        quantity,
        price: nextPrice,
        countInStock: stock,
      },
    });

    toast.success("Cart updated");
  };

  const updateQuantity = (item: CartItem, type: "inc" | "dec") => {
    const nextQty = type === "inc" ? item.quantity + 1 : item.quantity - 1;
    if (nextQty < 1) return;
    updateCartHandler(item, { quantity: nextQty });
  };

  return (
    <div className="px-4 lg:px-12 py-8">
      <h1 className="mb-6 text-xl font-semibold">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div>
          Cart is empty. <Link href="/">Go shopping</Link>
        </div>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-4 md:gap-5">
            <div className="overflow-x-auto md:col-span-3">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="p-5 text-left">Item</th>
                    <th className="p-5 text-left">Size</th>
                    <th className="p-5 text-left">Color</th>
                    <th className="p-5 text-right">Quantity</th>
                    <th className="p-5 text-right">Price</th>
                    <th className="p-5">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cartItems.map((item: CartItem) => (
                    <tr
                      key={`${item.slug}-${item.size || ""}-${item.color || ""}`}
                      className="border-b"
                    >
                      <td className="p-5">
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
                          <span>{item.name}</span>
                        </Link>
                      </td>

                      <td className="p-5">
                        <span className="text-sm">{item.size || "-"}</span>
                      </td>

                      <td className="p-5">
                        {item.color ? (
                          <div
                            className="h-6 w-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: item.color }}
                            title={item.color}
                          />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, "dec")}
                            className="rounded-md border border-gray-300 p-1 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, "inc")}
                            className="rounded-md border border-gray-300 p-1 hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        ${item.price.toFixed(2)}
                      </td>

                      <td className="p-5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemHandler(item)}
                          className="inline-flex items-center justify-center text-gray-600 hover:text-red-600"
                        >
                          <CircleX className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm h-fit">
              <ul>
                <li>
                  <div className="pb-3 text-xl">
                    Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)}) :
                    $
                    {cartItems
                      .reduce((a, c) => a + c.quantity * c.price, 0)
                      .toFixed(2)}
                  </div>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => router.push("/login?redirect=/shipping")}
                    className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
                  >
                    Check Out
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {cartItems.map((item: CartItem) => (
              <div
                key={`${item.slug}-${item.size || ""}-${item.color || ""}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <Link href={`/products/${item.slug}`}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  </Link>

                  <div className="flex-1">
                    <Link href={`/products/${item.slug}`}>
                      <h2 className="font-medium leading-tight">{item.name}</h2>
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      Size: {item.size || "-"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Color:</span>
                      {item.color ? (
                        <div
                          className="h-5 w-5 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                    <p className="mt-2 font-medium">${item.price.toFixed(2)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemHandler(item)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <CircleX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, "dec")}
                      className="rounded-md border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, "inc")}
                      className="rounded-md border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-semibold">
                Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)}) : $
                {cartItems
                  .reduce((a, c) => a + c.quantity * c.price, 0)
                  .toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => router.push("/login?redirect=/shipping")}
                className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
              >
                Check Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
