"use client";

import Link from "next/link";
import { Check, CreditCard, MapPin, ShoppingCart } from "lucide-react";

type CheckoutWizardProps = {
  activeStep: 0 | 1 | 2;
};

const steps = [
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingCart,
  },
  {
    label: "Shipping",
    href: "/shipping",
    icon: MapPin,
  },
  {
    label: "Review & Pay",
    href: "/placeorder",
    icon: CreditCard,
  },
] as const;

export default function CheckoutWizard({ activeStep }: CheckoutWizardProps) {
  return (
    <nav aria-label="Checkout progress" className="w-full">
      <ol className="flex w-full items-start">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < activeStep;
          const isActive = index === activeStep;
          const isUpcoming = index > activeStep;

          return (
            <li
              key={step.href}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-5 h-0.5 w-full ${
                    isComplete
                      ? "bg-blue-600 dark:bg-blue-400"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ) : null}

              <Link
                href={isUpcoming ? "#" : step.href}
                aria-current={isActive ? "step" : undefined}
                onClick={(event) => {
                  if (isUpcoming) {
                    event.preventDefault();
                  }
                }}
                className={`relative z-10 flex flex-col items-center gap-2 text-center ${
                  isUpcoming
                    ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    isComplete
                      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-gray-950"
                      : isActive
                        ? "border-blue-600 bg-white text-blue-600 dark:border-blue-400 dark:bg-gray-950 dark:text-blue-400"
                        : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </span>

                <span className="text-xs font-medium sm:text-sm">
                  {step.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
