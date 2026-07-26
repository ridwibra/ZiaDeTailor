import React from "react";

export default function CheckoutWizard({ activeStep = 0 }) {
  const steps = [
    "User Login",
    "Shipping Address",
    "Payment Method",
    "Place Order",
  ];

  return (
    <div className="mb-5 overflow-x-auto">
      <div className="flex min-w-max rounded-lg border border-gray-200 bg-white shadow-sm">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex-1 whitespace-nowrap border-b-2 px-4 py-3 text-center text-sm font-medium sm:px-6 ${
              index <= activeStep
                ? "border-indigo-500 text-indigo-500"
                : "border-gray-300 text-gray-400"
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
