"use client";

import React, { useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "@/store/Store";
import CheckoutWizard from "@/components/CheckoutWizard";

type ShippingFormValues = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type FieldErrors = Partial<Record<keyof ShippingFormValues, string>>;

export default function ShippingScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const { shippingAddress } = state.cart;

  const [form, setForm] = useState<ShippingFormValues>({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setForm({
      fullName: shippingAddress.fullName || "",
      address: shippingAddress.address || "",
      city: shippingAddress.city || "",
      postalCode: shippingAddress.postalCode || "",
      country: shippingAddress.country || "",
    });
  }, [shippingAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Please enter full name";
    if (!form.address.trim()) nextErrors.address = "Please enter address";
    else if (form.address.trim().length < 3) {
      nextErrors.address = "Address is more than 2 chars";
    }
    if (!form.city.trim()) nextErrors.city = "Please enter city";
    if (!form.postalCode.trim())
      nextErrors.postalCode = "Please enter postal code";
    if (!form.country.trim()) nextErrors.country = "Please enter country";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    dispatch({
      type: "SAVE_SHIPPING_ADDRESS",
      payload: form,
    });

    toast.success("Shipping address saved");
    router.push("/payment");
  };

  return (
    <div className="mx-auto pt-24 max-w-screen-md px-4 py-8">
      <CheckoutWizard activeStep={1} />

      <form className="space-y-4" onSubmit={submitHandler}>
        <h1 className="mb-4 text-xl font-semibold">Shipping Address</h1>

        <div className="mb-4">
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Full Name
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            id="fullName"
            autoFocus
            value={form.fullName}
            onChange={handleChange}
          />
          {errors.fullName && (
            <div className="mt-1 text-sm text-red-500">{errors.fullName}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="mb-1 block text-sm font-medium">
            Address
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            id="address"
            value={form.address}
            onChange={handleChange}
          />
          {errors.address && (
            <div className="mt-1 text-sm text-red-500">{errors.address}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="city" className="mb-1 block text-sm font-medium">
            City
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            id="city"
            value={form.city}
            onChange={handleChange}
          />
          {errors.city && (
            <div className="mt-1 text-sm text-red-500">{errors.city}</div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="postalCode"
            className="mb-1 block text-sm font-medium"
          >
            Postal Code
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            id="postalCode"
            value={form.postalCode}
            onChange={handleChange}
          />
          {errors.postalCode && (
            <div className="mt-1 text-sm text-red-500">{errors.postalCode}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="country" className="mb-1 block text-sm font-medium">
            Country
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            id="country"
            value={form.country}
            onChange={handleChange}
          />
          {errors.country && (
            <div className="mt-1 text-sm text-red-500">{errors.country}</div>
          )}
        </div>

        <div className="mb-4 flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Back
          </button>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

ShippingScreen.auth = true;
