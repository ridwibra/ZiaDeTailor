"use client";

import { useState } from "react";
import {
  PayPalButtons,
  PayPalCardFieldsForm,
  PayPalCardFieldsProvider,
  PayPalScriptProvider,
  usePayPalCardFields,
} from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  CartItem,
  PaymentMethod,
  ShippingAddress,
  useStore,
} from "@/store/Store";

type PayPalPaymentProps = {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  shippingRateId: string;
  paymentMethod: Extract<PaymentMethod, "paypal" | "card">;
};

type CreateOrderResponse = {
  id?: string;
  error?: string;
};

type CaptureOrderResponse = {
  id?: string;
  status?: string;
  error?: string;
};

type CardFieldsSubmitButtonProps = {
  disabled: boolean;
};

function isPopupCloseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.toLowerCase().includes("detected popup close");
}

function CardFieldsSubmitButton({ disabled }: CardFieldsSubmitButtonProps) {
  const { cardFieldsForm } = usePayPalCardFields();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!cardFieldsForm) {
      toast.error("Card fields are still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const state = await cardFieldsForm.getState();

      if (!state.isFormValid) {
        toast.error("Please enter valid card details.");
        return;
      }

      await cardFieldsForm.submit();
    } catch (error) {
      if (isPopupCloseError(error)) {
        toast.message("Payment cancelled. Your cart is unchanged.");
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Your card payment could not be completed.";

      console.error("PayPal Card Fields submit error:", error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={disabled || isSubmitting}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing payment...
        </>
      ) : (
        "Pay with card"
      )}
    </button>
  );
}

export default function PayPalPayment({
  cartItems,
  shippingAddress,
  shippingRateId,
  paymentMethod,
}: PayPalPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const resetCart = useStore((state) => state.resetCart);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        PayPal is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your
        environment variables.
      </p>
    );
  }

  if (cartItems.length === 0) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        Your cart is empty.
      </p>
    );
  }

  if (!shippingRateId) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        Please select a shipping rate before paying.
      </p>
    );
  }

  async function createOrder() {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          shippingRateId,
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as CreateOrderResponse | null;

      if (!response.ok || !data?.id) {
        throw new Error(data?.error || "PayPal could not create the order.");
      }

      return data.id;
    } catch (error) {
      if (!isPopupCloseError(error)) {
        const message =
          error instanceof Error
            ? error.message
            : "PayPal could not create the order.";

        console.error("PayPal create-order error:", error);
        toast.error(message);
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  }

  async function captureOrder(orderId: string) {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          shippingRateId,
          shippingAddress,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as CaptureOrderResponse | null;

      if (!response.ok || data?.status !== "COMPLETED" || !data.id) {
        throw new Error(data?.error || "PayPal could not capture the payment.");
      }

      resetCart();

      toast.success("Payment completed successfully.");

      window.location.assign(`/order-success?orderId=${data.id}`);
    } catch (error) {
      if (isPopupCloseError(error)) {
        toast.message("Payment cancelled. Your cart is unchanged.");
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "PayPal could not capture the payment.";

      console.error("PayPal capture-order error:", error);
      toast.error(message);

      throw error;
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePayPalCancel() {
    setIsProcessing(false);
    toast.message("Payment cancelled. Your cart is unchanged.");
  }

  function handlePayPalError(error: unknown, label: string) {
    setIsProcessing(false);

    if (isPopupCloseError(error)) {
      return;
    }

    console.error(`${label} error:`, error);

    toast.error(
      paymentMethod === "card"
        ? "Card payment could not be completed. Check your card details and try again."
        : "PayPal could not complete the payment. Please try again.",
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons,card-fields",
      }}
    >
      {paymentMethod === "paypal" ? (
        <div className="space-y-3">
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing secure payment...
            </div>
          ) : null}

          <PayPalButtons
            disabled={isProcessing}
            style={{
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
            }}
            createOrder={createOrder}
            onApprove={(data) => captureOrder(data.orderID)}
            onCancel={handlePayPalCancel}
            onError={(error) => handlePayPalError(error, "PayPal checkout")}
          />

          <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
            You will be redirected to PayPal to review and approve this payment.
          </p>
        </div>
      ) : (
        <PayPalCardFieldsProvider
          createOrder={createOrder}
          onApprove={(data) => captureOrder(data.orderID)}
          onError={(error) => handlePayPalError(error, "PayPal Card Fields")}
        >
          <div className="space-y-4">
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing secure payment...
              </div>
            ) : null}

            <PayPalCardFieldsForm />

            <CardFieldsSubmitButton disabled={isProcessing} />

            <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
              Your card details are securely processed by PayPal.
            </p>
          </div>
        </PayPalCardFieldsProvider>
      )}
    </PayPalScriptProvider>
  );
}
