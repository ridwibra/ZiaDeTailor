type PayPalOrderItem = {
  name: string;
  quantity: number;
  unitAmount: string;
};

type CreatePayPalOrderInput = {
  currencyCode?: string;
  items: PayPalOrderItem[];
  shippingAmount: string;
  taxAmount?: string;
  discountAmount?: string;
};

const paypalBaseUrl =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function formatMoney(value: number) {
  return value.toFixed(2);
}

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in .env.local.",
    );
  }

  return { clientId, clientSecret };
}

export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalCredentials();

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    console.error("PayPal token response:", {
      status: response.status,
      error: data?.error,
      errorDescription: data?.error_description,
    });

    throw new Error(
      data?.error_description || "Unable to authenticate with PayPal.",
    );
  }

  return data.access_token;
}

async function paypalFetch(path: string, options: RequestInit = {}) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${paypalBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("PayPal API response:", {
      status: response.status,
      name: data?.name,
      message: data?.message,
      details: data?.details,
      debugId: data?.debug_id,
    });

    throw new Error(
      data?.message || `PayPal API request failed (${response.status}).`,
    );
  }

  return data;
}

export async function createPayPalOrder({
  currencyCode = "USD",
  items,
  shippingAmount,
  taxAmount = "0.00",
  discountAmount = "0.00",
}: CreatePayPalOrderInput) {
  if (items.length === 0) {
    throw new Error("Cannot create a PayPal order with an empty cart.");
  }

  const formattedItems = items.map((item) => ({
    name: item.name.slice(0, 127),
    quantity: String(item.quantity),
    unit_amount: {
      currency_code: currencyCode,
      value: item.unitAmount,
    },
  }));

  const itemTotal = formattedItems.reduce(
    (sum, item) =>
      sum + Number(item.unit_amount.value) * Number(item.quantity),
    0,
  );

  const shipping = Number(shippingAmount);
  const tax = Number(taxAmount);
  const discount = Number(discountAmount);

  if (
    !Number.isFinite(shipping) ||
    !Number.isFinite(tax) ||
    !Number.isFinite(discount)
  ) {
    throw new Error("Invalid checkout amount.");
  }

  const total = itemTotal + shipping + tax - discount;

  if (total < 0) {
    throw new Error("Order total cannot be negative.");
  }

  return paypalFetch("/v2/checkout/orders", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: formatMoney(total),
            breakdown: {
              item_total: {
                currency_code: currencyCode,
                value: formatMoney(itemTotal),
              },
              shipping: {
                currency_code: currencyCode,
                value: formatMoney(shipping),
              },
              tax_total: {
                currency_code: currencyCode,
                value: formatMoney(tax),
              },
              discount: {
                currency_code: currencyCode,
                value: formatMoney(discount),
              },
            },
          },
          items: formattedItems,
        },
      ],
    }),
  });
}

export async function capturePayPalOrder(orderId: string) {
  if (!orderId?.trim()) {
    throw new Error("Missing PayPal order ID.");
  }

  return paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({}),
  });
}