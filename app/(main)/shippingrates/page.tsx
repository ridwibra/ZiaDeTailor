"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";

type ShippingRate = {
  _id: string;
  place: string;
  price: number;
  carrier: string;
};

type ShippingRatesListProps = {
  currency?: string;
  title?: string;
  description?: string;
  className?: string;
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export default function ShippingRatesList({
  currency = "USD",
  title = "Delivery rates",
  description = "These are the delivery locations currently available.",
  className = "",
}: ShippingRatesListProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRates() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/shipping?active=true", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load delivery rates.");
        }

        setRates(data?.rates ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load delivery rates.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRates();
  }, []);

  return (
    <section
      className={`mt-24 overflow-hidden rounded-2xl px-10 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mt-28 lg:mt-32 ${className}`}
    >
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
            <Truck className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading delivery rates…
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      ) : rates.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <MapPin className="h-5 w-5" />
          </span>

          <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
            No delivery rates available
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Please check again later.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {rates.map((rate) => (
            <article
              key={rate._id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />

                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                    {rate.place}
                  </h3>
                </div>

                {rate.carrier ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Truck className="h-3.5 w-3.5 shrink-0" />
                    {rate.carrier}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                    Carrier not specified
                  </p>
                )}
              </div>

              <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(rate.price, currency)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
