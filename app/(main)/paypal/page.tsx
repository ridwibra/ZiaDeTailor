"use client";

import { useMemo, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CartItem, ShippingAddress, useStore } from "@/store/Store";

type PayPalPaymentProps = {
  paymentMethod: "paypal" | "card" | "";
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
};

type CheckoutPayload = {
  items: Array<{
    productId: string;
    quantity: number;
    size: CartItem["size"];
    color?: CartItem["color"];
  }>;
  shippingAddress: ShippingAddress;
  paymentMethod: "paypal" | "card";
};

export default function PayPalPayment({
  paymentMethod,
  cartItems,
  shippingAddress,
}: PayPalPaymentProps) {
  const router = useRouter();
  const clearItems = useStore((state) => state.clearItems);

  const [creatingPayment, setCreatingPayment] = useState(false);
  const [capturingPayment, setCapturingPayment] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const payload = useMemo<CheckoutPayload | null>(() => {
    if (paymentMethod !== "paypal" && paymentMethod !== "card") {
      return null;
    }

    return {
      paymentMethod,
      shippingAddress,
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
    };
  }, [cartItems, paymentMethod, shippingAddress]);

  if (!clientId) {
    return (
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
        PayPal is not configured. Add `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to your
        environment variables.
      </p>
    );
  }

  if (!payload) {
    return (
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
        Please choose a payment method first.
      </p>
    );
  }

  if (paymentMethod === "card") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        Debit-card payment requires PayPal CardFields. Add the CardFields
        integration before enabling card payment.
      </div>
    );
  }

  const createPayPalOrder = async () => {
    try {
      setCreatingPayment(true);

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to start the PayPal payment.");
      }

      if (!data.paypalOrderId) {
        throw new Error("PayPal did not return an order ID.");
      }

      return data.paypalOrderId as string;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start PayPal payment.",
      );

      throw error;
    } finally {
      setCreatingPayment(false);
    }
  };

  const capturePayPalOrder = async (data: { orderID: string }) => {
    try {
      setCapturingPayment(true);

      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "PayPal payment could not be completed.",
        );
      }

      const orderId = result.order?._id;

      if (!orderId) {
        throw new Error("Payment succeeded, but no store order was returned.");
      }

      clearItems();
      toast.success("Payment successful. Your order has been placed.");
      router.push(`/order/${orderId}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment could not be completed.",
      );
    } finally {
      setCapturingPayment(false);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      {(creatingPayment || capturingPayment) && (
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          {capturingPayment
            ? "Confirming payment..."
            : "Starting PayPal checkout..."}
        </p>
      )}

      <PayPalButtons
        style={{
          layout: "vertical",
          shape: "rect",
          label: "paypal",
        }}
        disabled={creatingPayment || capturingPayment}
        createOrder={createPayPalOrder}
        onApprove={capturePayPalOrder}
        onCancel={() => {
          toast.info("PayPal payment was cancelled.");
        }}
        onError={() => {
          toast.error("PayPal could not complete the payment.");
        }}
      />
    </PayPalScriptProvider>
  );
}
