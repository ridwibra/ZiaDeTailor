"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "@/store/Store";
import CheckoutWizard from "@/components/CheckoutWizard";

type PaymentMethod = "card" | "cod";

type CardFormValues = {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
};

export default function PaymentScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const { shippingAddress, paymentMethod } = state.cart;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [cardForm, setCardForm] = useState<CardFormValues>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    if (!shippingAddress.address) {
      router.push("/shipping");
      return;
    }

    if (paymentMethod === "cod") {
      setSelectedMethod("cod");
    } else {
      setSelectedMethod("card");
    }
  }, [paymentMethod, router, shippingAddress.address]);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "expiry") {
      const raw = value.replace(/\D/g, "").slice(0, 4);
      const formatted =
        raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;

      setCardForm((prev) => ({
        ...prev,
        expiry: formatted,
      }));
      return;
    }

    setCardForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedMethod === "card") {
      if (
        !cardForm.cardNumber.trim() ||
        !cardForm.cardName.trim() ||
        !cardForm.expiry.trim() ||
        !cardForm.cvv.trim()
      ) {
        toast.error("Please complete your card details");
        return;
      }
    }

    dispatch({
      type: "SAVE_PAYMENT_METHOD",
      payload: selectedMethod === "card" ? "card" : "cod",
    });

    toast.success(
      selectedMethod === "card"
        ? "Debit / credit card selected"
        : "Pay on delivery selected",
    );

    router.push("/placeorder");
  };

  return (
    <div className=" pt-24 mx-auto max-w-screen-md px-4 py-8">
      <CheckoutWizard activeStep={2} />

      <form className="space-y-4" onSubmit={submitHandler}>
        <h1 className="mb-4 text-xl font-semibold">Payment Method</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <label
              htmlFor="card"
              className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              <input
                id="card"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === "card"}
                onChange={() => setSelectedMethod("card")}
                className="h-4 w-4 accent-black"
              />
              <span className="text-sm font-medium">Debit / Credit Card</span>
            </label>

            <label
              htmlFor="cod"
              className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              <input
                id="cod"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === "cod"}
                onChange={() => setSelectedMethod("cod")}
                className="h-4 w-4 accent-black"
              />
              <span className="text-sm font-medium">Pay on Delivery</span>
            </label>
          </div>

          {selectedMethod === "card" && (
            <div className="mt-6 grid gap-4">
              <div>
                <label
                  htmlFor="cardNumber"
                  className="mb-1 block text-sm font-medium"
                >
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  value={cardForm.cardNumber}
                  onChange={handleCardChange}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="cardName"
                  className="mb-1 block text-sm font-medium"
                >
                  Name on Card
                </label>
                <input
                  id="cardName"
                  value={cardForm.cardName}
                  onChange={handleCardChange}
                  placeholder="John Doe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expiry"
                    className="mb-1 block text-sm font-medium"
                  >
                    Expiry
                  </label>
                  <input
                    id="expiry"
                    value={cardForm.expiry}
                    onChange={handleCardChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    inputMode="numeric"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cvv"
                    className="mb-1 block text-sm font-medium"
                  >
                    CVV
                  </label>
                  <input
                    id="cvv"
                    value={cardForm.cvv}
                    onChange={handleCardChange}
                    placeholder="123"
                    inputMode="numeric"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => router.push("/shipping")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            >
              Back
            </button>

            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

PaymentScreen.auth = true;
