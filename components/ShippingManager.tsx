"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

type ShippingRate = {
  _id: string;
  place: string;
  price: number;
  carrier: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ShippingForm = {
  place: string;
  price: string;
  carrier: string;
  isActive: boolean;
};

const emptyForm: ShippingForm = {
  place: "",
  price: "",
  carrier: "",
  isActive: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

async function readApiResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong.");
  }

  return data;
}

export default function ShippingManager() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const editingRate = useMemo(
    () => rates.find((rate) => rate._id === editingId) ?? null,
    [editingId, rates],
  );

  async function loadRates() {
    try {
      setLoading(true);

      const response = await fetch("/api/shipping", {
        cache: "no-store",
      });

      const data = await readApiResponse(response);
      setRates(data.rates ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load shipping rates.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRates();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(rate: ShippingRate) {
    setEditingId(rate._id);

    setForm({
      place: rate.place,
      price: String(rate.price),
      carrier: rate.carrier ?? "",
      isActive: rate.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const place = form.place.trim();
    const carrier = form.carrier.trim();
    const price = Number(form.price);

    if (place.length < 2) {
      toast.error("Enter a place with at least 2 characters.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid shipping price of 0 or more.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing ? `/api/shipping/${editingId}` : "/api/shipping",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            place,
            price,
            carrier,
            isActive: form.isActive,
          }),
        },
      );

      const data = await readApiResponse(response);

      if (isEditing) {
        setRates((currentRates) =>
          currentRates.map((rate) =>
            rate._id === editingId ? data.rate : rate,
          ),
        );

        toast.success("Shipping rate updated.");
      } else {
        setRates((currentRates) =>
          [...currentRates, data.rate].sort((first, second) =>
            first.place.localeCompare(second.place),
          ),
        );

        toast.success("Shipping rate added.");
      }

      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save shipping rate.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleRateStatus(rate: ShippingRate) {
    try {
      setUpdatingId(rate._id);

      const response = await fetch(`/api/shipping/${rate._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !rate.isActive,
        }),
      });

      const data = await readApiResponse(response);

      setRates((currentRates) =>
        currentRates.map((currentRate) =>
          currentRate._id === rate._id ? data.rate : currentRate,
        ),
      );

      toast.success(
        data.rate.isActive
          ? "Shipping rate activated."
          : "Shipping rate deactivated.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update shipping rate.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRate(rate: ShippingRate) {
    const confirmed = window.confirm(
      `Delete the shipping rate for "${rate.place}"${
        rate.carrier ? ` with ${rate.carrier}` : ""
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(rate._id);

      const response = await fetch(`/api/shipping/${rate._id}`, {
        method: "DELETE",
      });

      await readApiResponse(response);

      setRates((currentRates) =>
        currentRates.filter((currentRate) => currentRate._id !== rate._id),
      );

      if (editingId === rate._id) {
        resetForm();
      }

      toast.success("Shipping rate deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete shipping rate.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-6 pt-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-5 sm:pb-8 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Truck className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                  Delivery settings
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Shipping rates
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Create delivery locations, set shipping charges, and optionally
                record the carrier customers should expect.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
              <MapPin className="h-4 w-4" />
              {rates.length} saved
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingRate ? "Edit shipping rate" : "Add shipping rate"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Active rates appear as delivery choices during checkout.
                </p>
              </div>

              {editingRate ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>

          <form onSubmit={submitForm} className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block sm:col-span-2 xl:col-span-1">
                <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Place
                </span>

                <input
                  type="text"
                  value={form.place}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      place: event.target.value,
                    }))
                  }
                  placeholder="e.g. Lagos Island"
                  maxLength={120}
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/15"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Shipping price
                </span>

                <input
                  type="number"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="e.g. 15.00"
                  min="0"
                  step="0.01"
                  required
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/15"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Carrier{" "}
                  <span className="font-medium text-slate-400 dark:text-slate-500">
                    (optional)
                  </span>
                </span>

                <input
                  type="text"
                  value={form.carrier}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      carrier: event.target.value,
                    }))
                  }
                  placeholder="e.g. DHL"
                  maxLength={120}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/15"
                />
              </label>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800 xl:mt-[30px]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-slate-600 dark:accent-teal-400"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Available at checkout
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
              {editingRate ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-400 dark:hover:text-slate-950"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingRate ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : editingRate
                    ? "Save changes"
                    : "Add shipping rate"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Saved delivery options
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Inactive rates remain saved but are hidden from checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRates()}
              disabled={loading}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Loading shipping rates
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Please wait a moment.
                </p>
              </div>
            </div>
          ) : rates.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Truck className="h-6 w-6" />
              </span>

              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                No shipping rates yet
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add your first delivery location above to make it available at
                checkout.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {rates.map((rate) => {
                const isUpdating = updatingId === rate._id;
                const isDeleting = deletingId === rate._id;

                return (
                  <article
                    key={rate._id}
                    className="px-5 py-5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                            <MapPin className="h-4 w-4" />
                          </span>

                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-900 dark:text-white">
                              {rate.place}
                            </h3>

                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {rate.carrier ? (
                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                  <Truck className="h-3.5 w-3.5" />
                                  {rate.carrier}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500 dark:text-slate-500">
                                  No carrier specified
                                </span>
                              )}

                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  rate.isActive
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {rate.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white sm:mr-1">
                          {formatCurrency(rate.price)}
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => void toggleRateStatus(rate)}
                            disabled={isUpdating || isDeleting}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            {isUpdating
                              ? "Saving..."
                              : rate.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEdit(rate)}
                            disabled={isUpdating || isDeleting}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteRate(rate)}
                            disabled={isUpdating || isDeleting}
                            className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20 sm:col-span-1"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
