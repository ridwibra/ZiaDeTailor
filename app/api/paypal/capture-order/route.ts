import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getSession } from "@/lib/server";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ShippingRate from "@/models/ShippingRate";
import { capturePayPalOrder } from "@/utils/paypal";
import db from "@/utils/db";

export const runtime = "nodejs";

type UnknownRecord = Record<string, unknown>;

type RequestedSize = {
  label: string;
  isCustom: boolean;
  measurementType?: "top" | "bottom" | "head";
  measurements?: Record<string, string>;
};

type RequestedColor = {
  name: string;
  hex: string;
};

type RequestedItem = {
  productId: string;
  quantity: number;
  size: RequestedSize;
  color?: RequestedColor;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMeasurements(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const measurements = Object.fromEntries(
    Object.entries(value)
      .map(([key, measurement]) => [
        key.trim(),
        typeof measurement === "string"
          ? measurement.trim()
          : String(measurement ?? "").trim(),
      ])
      .filter(([key, measurement]) => key.length > 0 && measurement.length > 0),
  );

  return Object.keys(measurements).length > 0 ? measurements : undefined;
}

function parseRequestedSize(value: unknown): RequestedSize | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = getString(value.label);
  const isCustom = value.isCustom === true;

  const rawMeasurementType = getString(value.measurementType);

  const measurementType =
    rawMeasurementType === "top" ||
    rawMeasurementType === "bottom" ||
    rawMeasurementType === "head"
      ? rawMeasurementType
      : undefined;

  const measurements = normalizeMeasurements(value.measurements);

  if (!label) {
    return null;
  }

  if (isCustom && (!measurementType || !measurements)) {
    return null;
  }

  return {
    label,
    isCustom,
    measurementType,
    measurements,
  };
}

function parseRequestedColor(value: unknown): RequestedColor | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = getString(value.name);
  const hex = getString(value.hex);

  if (!name || !hex) {
    return undefined;
  }

  return { name, hex };
}

function parseRequestedItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Your cart is empty.");
  }

  return value.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      throw new Error(`Cart item ${index + 1} is invalid.`);
    }

    const productId = getString(rawItem.productId);
    const quantity = Number(rawItem.quantity);
    const size = parseRequestedSize(rawItem.size);
    const color = parseRequestedColor(rawItem.color);

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error(`Cart item ${index + 1} has an invalid product ID.`);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Cart item ${index + 1} has an invalid quantity.`);
    }

    if (!size) {
      throw new Error(`Cart item ${index + 1} has an invalid selected size.`);
    }

    return {
      productId,
      quantity,
      size,
      color,
    };
  });
}

function parseShippingAddress(value: unknown): ShippingAddress {
  if (!isRecord(value)) {
    throw new Error("A shipping address is required.");
  }

  const address = {
    fullName: getString(value.fullName),
    phone: getString(value.phone),
    street: getString(value.street),
    city: getString(value.city),
    state: getString(value.state),
    postalCode: getString(value.postalCode),
    country: getString(value.country),
  };

  if (Object.values(address).some((entry) => !entry)) {
    throw new Error("Please provide a complete shipping address.");
  }

  return address;
}

function getProductSizePrice(product: UnknownRecord, requestedLabel: string) {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];

  const matchingSize = sizes.find((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    return (
      getString(entry.size).toLowerCase() === requestedLabel.toLowerCase()
    );
  });

  if (!matchingSize || !isRecord(matchingSize)) {
    return NaN;
  }

  return Number(matchingSize.price);
}

function validateProductColor(
  product: UnknownRecord,
  requestedColor?: RequestedColor,
) {
  if (!requestedColor) {
    return undefined;
  }

  const colors = Array.isArray(product.colors) ? product.colors : [];

  const matchingColor = colors.find((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    return (
      getString(entry.hex).toLowerCase() ===
      requestedColor.hex.toLowerCase()
    );
  });

  if (!matchingColor || !isRecord(matchingColor)) {
    throw new Error(
      `The selected color "${requestedColor.name}" is no longer available.`,
    );
  }

  return {
    name: getString(matchingColor.name),
    hex: getString(matchingColor.hex),
  };
}

function getCapturedAmount(paypalOrder: UnknownRecord) {
  const purchaseUnits = Array.isArray(paypalOrder.purchase_units)
    ? paypalOrder.purchase_units
    : [];

  const firstPurchaseUnit = purchaseUnits[0];

  if (!isRecord(firstPurchaseUnit)) {
    return NaN;
  }

  const payments = isRecord(firstPurchaseUnit.payments)
    ? firstPurchaseUnit.payments
    : null;

  const captures = payments && Array.isArray(payments.captures)
    ? payments.captures
    : [];

  const capture = captures[0];

  if (!isRecord(capture) || !isRecord(capture.amount)) {
    return NaN;
  }

  return Number(capture.amount.value);
}

function getCaptureId(paypalOrder: UnknownRecord) {
  const purchaseUnits = Array.isArray(paypalOrder.purchase_units)
    ? paypalOrder.purchase_units
    : [];

  const firstPurchaseUnit = purchaseUnits[0];

  if (!isRecord(firstPurchaseUnit)) {
    return "";
  }

  const payments = isRecord(firstPurchaseUnit.payments)
    ? firstPurchaseUnit.payments
    : null;

  const captures = payments && Array.isArray(payments.captures)
    ? payments.captures
    : [];

  const capture = captures[0];

  return isRecord(capture) ? getString(capture.id) : "";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Please sign in before placing an order." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const orderId = getString(body.orderId);
    const shippingRateId = getString(body.shippingRateId);
    const paymentMethod =
      body.paymentMethod === "card" ? "card" : "paypal";

    const requestedItems = parseRequestedItems(body.items);
    const shippingAddress = parseShippingAddress(body.shippingAddress);

    if (!orderId) {
      return NextResponse.json(
        { error: "A PayPal order ID is required." },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(shippingRateId)) {
      return NextResponse.json(
        { error: "Please select a valid shipping rate." },
        { status: 400 },
      );
    }

    await db.connect();

    const existingOrder = await Order.findOne({
      "payment.transactionId": orderId,
    }).lean();

    if (existingOrder) {
      return NextResponse.json({
        id: String(existingOrder._id),
        paypalOrderId: orderId,
        status: "COMPLETED",
      });
    }

    const shippingRate = await ShippingRate.findOne({
      _id: shippingRateId,
      isActive: true,
    }).lean();

    if (!shippingRate) {
      return NextResponse.json(
        { error: "The selected shipping rate is no longer available." },
        { status: 400 },
      );
    }

    const trustedItems = await Promise.all(
      requestedItems.map(async (item, index) => {
        const product = await Product.findById(item.productId).lean();

        if (!product) {
          throw new Error(
            `The product for cart item ${index + 1} was not found.`,
          );
        }

        const productData = product as UnknownRecord;

        const name = getString(productData.name);
        const slug = getString(productData.slug);
        const sellerId = productData.addedBy;
        const countInStock = Number(productData.countInStock);
        const unitPrice = getProductSizePrice(productData, item.size.label);

        if (!name || !slug || !sellerId) {
          throw new Error(`Product ${item.productId} is incomplete.`);
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(
            `Size "${item.size.label}" is unavailable for "${name}".`,
          );
        }

        if (!Number.isInteger(countInStock) || countInStock < item.quantity) {
          throw new Error(`"${name}" no longer has enough stock.`);
        }

        const images = Array.isArray(productData.images)
          ? productData.images
          : [];

        const firstImage = images.find(isRecord);

        if (!firstImage || !isRecord(firstImage)) {
          throw new Error(`"${name}" does not have a product image.`);
        }

        const imageUrl = getString(firstImage.url);
        const imagePublicId = getString(firstImage.public_id);

        if (!imageUrl) {
          throw new Error(`"${name}" does not have a valid product image.`);
        }

        const color = validateProductColor(productData, item.color);

        return {
          productId: item.productId,
          sellerId,
          name,
          slug,
          image: {
            url: imageUrl,
            public_id: imagePublicId,
          },
          size: item.size,
          color,
          quantity: item.quantity,
          unitPrice: roundMoney(unitPrice),
          total: roundMoney(unitPrice * item.quantity),
        };
      }),
    );

    const subtotal = roundMoney(
      trustedItems.reduce((sum, item) => sum + item.total, 0),
    );

    const shippingFee = roundMoney(Number(shippingRate.price));
    const tax = 0;
    const discount = 0;
    const expectedTotal = roundMoney(
      subtotal + shippingFee + tax - discount,
    );

    const paypalOrder = await capturePayPalOrder(orderId);

    if (paypalOrder.status !== "COMPLETED") {
      throw new Error("PayPal did not complete the payment.");
    }

    const paypalOrderData = paypalOrder as UnknownRecord;
    const capturedAmount = getCapturedAmount(paypalOrderData);
    const captureId = getCaptureId(paypalOrderData);

    if (!Number.isFinite(capturedAmount)) {
      throw new Error("Unable to verify the captured PayPal amount.");
    }

    if (Math.abs(capturedAmount - expectedTotal) > 0.001) {
      throw new Error(
        "The captured PayPal amount does not match the server order total.",
      );
    }

    if (!captureId) {
      throw new Error("PayPal did not return a capture transaction ID.");
    }

    /*
      Reduce stock only after PayPal capture succeeds.
      Each update includes countInStock >= quantity, preventing overselling
      if another buyer checks out at the same time.
    */
    for (const item of trustedItems) {
      const stockUpdate = await Product.updateOne(
        {
          _id: item.productId,
          countInStock: { $gte: item.quantity },
        },
        {
          $inc: {
            countInStock: -item.quantity,
            sales: item.quantity,
          },
        },
      );

      if (stockUpdate.modifiedCount !== 1) {
        throw new Error(
          `"${item.name}" sold out while payment was being processed. Contact support with PayPal order ${orderId}.`,
        );
      }
    }

    const order = await Order.create({
      userId,
      items: trustedItems,
      subtotal,
      tax,
      shippingFee,
      discount,
      total: expectedTotal,
      payment: {
        method: paymentMethod,
        status: "paid",
        transactionId: orderId,
      },
      shippingAddress,
      fulfillment: {
        status: "pending",
      },
    });

    return NextResponse.json({
      id: String(order._id),
      paypalOrderId: orderId,
      captureId,
      status: "COMPLETED",
    });
  } catch (error) {
    console.error("Failed to capture PayPal order:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to capture the PayPal order.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}