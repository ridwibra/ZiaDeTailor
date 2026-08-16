"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import CheckoutWizard from "@/components/CheckoutWizard";
import { SelectedShippingRate, useStore } from "@/store/Store";

type ShippingFormValues = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type FieldErrors = Partial<Record<keyof ShippingFormValues, string>>;

type SavedAddress = ShippingFormValues & {
  _id: string;
  label: string;
  isDefault: boolean;
};

type ShippingRate = SelectedShippingRate;

const emptyForm: ShippingFormValues = {
  fullName: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function ShippingScreen() {
  const router = useRouter();
  const shippingPickerRef = useRef<HTMLDivElement>(null);

  const cartItems = useStore((store) => store.cartItems);
  const shippingAddress = useStore((store) => store.shippingAddress);
  const shippingRate = useStore((store) => store.shippingRate);
  const saveShippingAddress = useStore((store) => store.saveShippingAddress);
  const saveShippingRate = useStore((store) => store.saveShippingRate);

  const [form, setForm] = useState<ShippingFormValues>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState(shippingRate?._id ?? "");
  const [loadingRates, setLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [shippingSearch, setShippingSearch] = useState("");
  const [shippingPickerOpen, setShippingPickerOpen] = useState(false);

  const [saveForLater, setSaveForLater] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => total + item.quantity * item.price, 0),
    [cartItems],
  );

  const selectedRate =
    rates.find((rate) => rate._id === selectedRateId) ??
    (shippingRate && shippingRate._id === selectedRateId ? shippingRate : null);

  const shippingCost = selectedRate?.price ?? 0;
  const orderTotal = subtotal + shippingCost;

  const filteredRates = useMemo(() => {
    const query = shippingSearch.trim().toLowerCase();

    if (!query) {
      return rates;
    }

    return rates.filter(
      (rate) =>
        rate.place.toLowerCase().includes(query) ||
        rate.carrier.toLowerCase().includes(query),
    );
  }, [rates, shippingSearch]);

  useEffect(() => {
    function closeShippingPickerOnOutsideClick(event: MouseEvent | TouchEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        shippingPickerRef.current &&
        !shippingPickerRef.current.contains(target)
      ) {
        setShippingPickerOpen(false);
        setShippingSearch("");
      }
    }

    document.addEventListener("mousedown", closeShippingPickerOnOutsideClick);

    document.addEventListener("touchstart", closeShippingPickerOnOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeShippingPickerOnOutsideClick,
      );

      document.removeEventListener(
        "touchstart",
        closeShippingPickerOnOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    setForm({
      fullName: shippingAddress.fullName || "",
      street: shippingAddress.street || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      postalCode: shippingAddress.postalCode || "",
      country: shippingAddress.country || "",
      phone: shippingAddress.phone || "",
    });
  }, [
    shippingAddress.city,
    shippingAddress.country,
    shippingAddress.fullName,
    shippingAddress.phone,
    shippingAddress.postalCode,
    shippingAddress.state,
    shippingAddress.street,
  ]);

  useEffect(() => {
    async function loadSavedAddresses() {
      try {
        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load saved addresses.");
        }

        const addresses = Array.isArray(data.addresses)
          ? (data.addresses as SavedAddress[])
          : [];

        setSavedAddresses(addresses);

        const hasExistingShippingData = Boolean(
          shippingAddress.fullName ||
          shippingAddress.street ||
          shippingAddress.city ||
          shippingAddress.postalCode,
        );

        if (hasExistingShippingData) {
          return;
        }

        const defaultAddress = addresses.find((address) => address.isDefault);

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);

          setForm({
            fullName: defaultAddress.fullName,
            phone: defaultAddress.phone,
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
          });
        }
      } catch (error) {
        console.error("Failed to load saved addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    }

    void loadSavedAddresses();
  }, [
    shippingAddress.city,
    shippingAddress.fullName,
    shippingAddress.postalCode,
    shippingAddress.street,
  ]);

  useEffect(() => {
    async function loadShippingRates() {
      try {
        setLoadingRates(true);
        setRatesError("");

        const response = await fetch("/api/shipping?active=true", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load shipping rates.");
        }

        const activeRates = Array.isArray(data?.rates)
          ? (data.rates as ShippingRate[])
          : [];

        setRates(activeRates);

        if (shippingRate?._id) {
          const savedRateStillActive = activeRates.find(
            (rate) => rate._id === shippingRate._id,
          );

          if (savedRateStillActive) {
            setSelectedRateId(savedRateStillActive._id);
            return;
          }

          saveShippingRate(null);
          setSelectedRateId("");
        }
      } catch (error) {
        setRatesError(
          error instanceof Error
            ? error.message
            : "Unable to load shipping rates.",
        );
      } finally {
        setLoadingRates(false);
      }
    }

    void loadShippingRates();
  }, [saveShippingRate, shippingRate?._id]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof ShippingFormValues;
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  function selectSavedAddress(addressId: string) {
    setSelectedAddressId(addressId);

    if (!addressId) {
      return;
    }

    const address = savedAddresses.find((item) => item._id === addressId);

    if (!address) {
      return;
    }

    setForm({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    setErrors({});
  }

  function selectShippingRate(rate: ShippingRate) {
    setSelectedRateId(rate._id);
    saveShippingRate(rate);
    setShippingSearch("");
    setShippingPickerOpen(false);
  }

  function clearShippingRate() {
    setSelectedRateId("");
    setShippingSearch("");
    setShippingPickerOpen(true);
    saveShippingRate(null);
  }

  function validateAddress() {
    const nextErrors: FieldErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }

    if (!form.street.trim()) {
      nextErrors.street = "Please enter your street address.";
    } else if (form.street.trim().length < 3) {
      nextErrors.street = "Street address must contain at least 3 characters.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Please enter your city.";
    }

    if (!form.state.trim()) {
      nextErrors.state = "Please enter your state or region.";
    }

    if (!form.postalCode.trim()) {
      nextErrors.postalCode = "Please enter your postal code.";
    }

    if (!form.country.trim()) {
      nextErrors.country = "Please enter your country.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    }

    if (saveForLater && !addressLabel.trim()) {
      toast.error("Please enter a label for the saved address.");
      return false;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function saveAddressBookEntry(address: ShippingFormValues) {
    const response = await fetch("/api/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: addressLabel.trim(),
        ...address,
        isDefault: savedAddresses.length === 0,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to save the address.");
    }

    return data.address as SavedAddress;
  }

  async function submitHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      router.push("/cart");
      return;
    }

    if (!selectedRate) {
      toast.error("Please choose a shipping option.");
      return;
    }

    if (!validateAddress()) {
      toast.error("Please correct the shipping address fields.");
      return;
    }

    const normalizedAddress: ShippingFormValues = {
      fullName: form.fullName.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
    };

    try {
      if (saveForLater) {
        const savedAddress = await saveAddressBookEntry(normalizedAddress);

        setSavedAddresses((previous) => [
          savedAddress,
          ...previous.map((address) => ({
            ...address,
            isDefault: savedAddress.isDefault ? false : address.isDefault,
          })),
        ]);

        setSelectedAddressId(savedAddress._id);
      }

      saveShippingAddress(normalizedAddress);
      saveShippingRate(selectedRate);

      toast.success("Shipping address and delivery option saved.");

      router.push("/placeorder");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save address.",
      );
    }
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-24 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:px-6 sm:pb-10 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-screen-lg">
        <CheckoutWizard activeStep={1} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form className="space-y-4" onSubmit={submitHandler}>
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h1 className="text-xl font-semibold">Shipping Address</h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter the address where your order should be delivered.
              </p>

              {loadingAddresses ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  Loading saved addresses...
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <label
                    htmlFor="savedAddress"
                    className="mb-1 block text-sm font-medium"
                  >
                    Use a saved address
                  </label>

                  <select
                    id="savedAddress"
                    value={selectedAddressId}
                    onChange={(event) => selectSavedAddress(event.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  >
                    <option value="">Enter a different address</option>

                    {savedAddresses.map((address) => (
                      <option key={address._id} value={address._id}>
                        {address.label}
                        {address.isDefault ? " (Default)" : ""} —{" "}
                        {address.street}, {address.city}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    You may edit the form below for this order. Changes made
                    here do not modify your saved address.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField
                  id="fullName"
                  label="Full Name"
                  value={form.fullName}
                  error={errors.fullName}
                  onChange={handleChange}
                  autoFocus
                  autoComplete="name"
                />

                <FormField
                  id="phone"
                  label="Phone Number"
                  value={form.phone}
                  error={errors.phone}
                  onChange={handleChange}
                  inputMode="tel"
                  autoComplete="tel"
                />

                <div className="sm:col-span-2">
                  <FormField
                    id="street"
                    label="Street Address"
                    value={form.street}
                    error={errors.street}
                    onChange={handleChange}
                    autoComplete="street-address"
                  />
                </div>

                <FormField
                  id="city"
                  label="City"
                  value={form.city}
                  error={errors.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                />

                <FormField
                  id="state"
                  label="State / Region"
                  value={form.state}
                  error={errors.state}
                  onChange={handleChange}
                  autoComplete="address-level1"
                />

                <FormField
                  id="postalCode"
                  label="Postal Code"
                  value={form.postalCode}
                  error={errors.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                />

                <FormField
                  id="country"
                  label="Country"
                  value={form.country}
                  error={errors.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                />
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={saveForLater}
                    onChange={(event) => setSaveForLater(event.target.checked)}
                    className="h-4 w-4 accent-black dark:accent-white"
                  />
                  Save this address for future orders
                </label>

                {saveForLater ? (
                  <div className="mt-3">
                    <label
                      htmlFor="addressLabel"
                      className="mb-1 block text-sm font-medium"
                    >
                      Address label
                    </label>

                    <input
                      id="addressLabel"
                      type="text"
                      value={addressLabel}
                      onChange={(event) => setAddressLabel(event.target.value)}
                      maxLength={50}
                      placeholder="Home, Office, Family..."
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-black dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-white"
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section className="overflow-visible rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <Truck className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-semibold">Choose shipping</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Search by delivery location or carrier, then select a rate.
                  </p>
                </div>
              </div>

              {loadingRates ? (
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading shipping options...
                </div>
              ) : ratesError ? (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                >
                  {ratesError}
                </div>
              ) : rates.length === 0 ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  No shipping options are available right now.
                </div>
              ) : (
                <div ref={shippingPickerRef} className="relative z-20 mt-5">
                  <label
                    htmlFor="shippingRateSearch"
                    className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Shipping destination
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="shippingRateSearch"
                      type="text"
                      value={shippingPickerOpen ? shippingSearch : ""}
                      onFocus={() => {
                        setShippingPickerOpen(true);
                        setShippingSearch("");
                      }}
                      onChange={(event) => {
                        setShippingSearch(event.target.value);
                        setShippingPickerOpen(true);
                      }}
                      placeholder={
                        selectedRate
                          ? `${selectedRate.place}${
                              selectedRate.carrier
                                ? ` · ${selectedRate.carrier}`
                                : ""
                            } · ${formatCurrency(selectedRate.price)}`
                          : "Search place or carrier..."
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-teal-400"
                      aria-expanded={shippingPickerOpen}
                      aria-controls="shipping-rate-results"
                      autoComplete="off"
                    />

                    {selectedRate && !shippingPickerOpen ? (
                      <button
                        type="button"
                        onClick={clearShippingRate}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                        aria-label="Clear selected shipping rate"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>

                  {selectedRate && !shippingPickerOpen ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-500/20 dark:bg-teal-500/10">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-semibold text-teal-900 dark:text-teal-100">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {selectedRate.place}
                        </p>

                        {selectedRate.carrier ? (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-teal-700 dark:text-teal-300">
                            <Truck className="h-3.5 w-3.5" />
                            {selectedRate.carrier}
                          </p>
                        ) : null}
                      </div>

                      <span className="shrink-0 font-bold text-teal-900 dark:text-teal-100">
                        {formatCurrency(selectedRate.price)}
                      </span>
                    </div>
                  ) : null}

                  {shippingPickerOpen ? (
                    <div
                      id="shipping-rate-results"
                      className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="max-h-[min(18rem,calc(100vh-14rem))] overflow-y-auto p-1">
                        {filteredRates.length === 0 ? (
                          <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            No shipping rates match “{shippingSearch}”.
                          </div>
                        ) : (
                          filteredRates.map((rate) => {
                            const selected = selectedRateId === rate._id;

                            return (
                              <button
                                key={rate._id}
                                type="button"
                                onClick={() => selectShippingRate(rate)}
                                className={`flex w-full items-center justify-between gap-4 rounded-md px-3 py-3 text-left transition ${
                                  selected
                                    ? "bg-teal-50 text-teal-950 dark:bg-teal-500/15 dark:text-teal-100"
                                    : "text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                }`}
                              >
                                <span className="min-w-0">
                                  <span className="flex items-center gap-2 font-medium">
                                    <MapPin className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                                    <span className="truncate">
                                      {rate.place}
                                    </span>
                                  </span>

                                  {rate.carrier ? (
                                    <span className="mt-1 flex items-center gap-1.5 pl-6 text-xs text-gray-500 dark:text-gray-400">
                                      <Truck className="h-3.5 w-3.5 shrink-0" />
                                      {rate.carrier}
                                    </span>
                                  ) : null}
                                </span>

                                <span className="flex shrink-0 items-center gap-2 font-bold">
                                  {formatCurrency(rate.price)}
                                  {selected ? (
                                    <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                  ) : null}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        {filteredRates.length}{" "}
                        {filteredRates.length === 1 ? "option" : "options"}{" "}
                        found
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-gray-950 sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Back to Cart
              </button>

              <button
                type="submit"
                disabled={loadingRates || rates.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Check className="h-4 w-4" />
                Continue to Payment
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Order summary</h2>

            <div className="mt-4 space-y-3 border-b border-gray-200 pb-4 text-sm dark:border-gray-700">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.quantity}`}
                  className="flex justify-between gap-4"
                >
                  <span className="min-w-0 text-gray-600 dark:text-gray-300">
                    {item.name} × {item.quantity}
                  </span>

                  <span className="shrink-0 font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Shipping
                </span>
                <span>
                  {selectedRate
                    ? formatCurrency(shippingCost)
                    : "Select a rate"}
                </span>
              </div>

              {selectedRate ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRate.place}
                  {selectedRate.carrier ? ` · ${selectedRate.carrier}` : ""}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-bold dark:border-gray-700">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FormField({
  id,
  label,
  value,
  error,
  onChange,
  autoFocus = false,
  autoComplete,
  inputMode,
}: {
  id: keyof ShippingFormValues;
  label: string;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
      />

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
