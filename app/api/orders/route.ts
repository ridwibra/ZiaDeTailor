import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Types } from "mongoose";

import { auth } from "@/lib/auth";
import db from "@/utils/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

type PaymentMethod = "paypal" | "card";
type MeasurementType = "top" | "bottom";

type CheckoutItem = {
  productId: string;
  quantity: number;
  size: {
    label: string;
    isCustom: boolean;
    measurementType?: MeasurementType;
    measurements?: Record<string, string>;
  };
  color?: {
    name: string;
    hex: string;
  };
};

type CheckoutRequestBody = {
  items: CheckoutItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: PaymentMethod;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeMeasurements = (
  measurements?: Record<string, string>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(measurements ?? {})
      .map(([field, value]) => [field.trim(), String(value).trim()])
      .filter(([field, value]) => field.length > 0 && value.length > 0)
      .sort(([firstField], [secondField]) =>
        firstField.localeCompare(secondField),
      ),
  );

const hasCompleteShippingAddress = (
  shippingAddress: CheckoutRequestBody["shippingAddress"],
) =>
  Boolean(
    shippingAddress?.fullName?.trim() &&
      shippingAddress?.phone?.trim() &&
      shippingAddress?.street?.trim() &&
      shippingAddress?.city?.trim() &&
      shippingAddress?.state?.trim() &&
      shippingAddress?.postalCode?.trim() &&
      shippingAddress?.country?.trim(),
  );

const getRole = (
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
) =>
  (
    session?.user as
      | { role?: "user" | "staff" | "admin" }
      | undefined
  )?.role;

const isStaffOrAdmin = (role?: string) =>
  role === "admin" || role === "staff";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || !Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 },
      );
    }

    const role = getRole(session);
    const mine = request.nextUrl.searchParams.get("mine") === "true";

    if (!mine && !isStaffOrAdmin(role)) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 403 },
      );
    }

    await db.connect();

    const filter =
      mine && !isStaffOrAdmin(role)
        ? { userId: new Types.ObjectId(session.user.id) }
        : {};

    const orders = await Order.find(filter)
      .select(
        "userId total createdAt payment fulfillment items shippingAddress",
      )
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean();

    const serializedOrders = orders.map((order) => {
      const user = order.userId as unknown as
        | { name?: string; email?: string }
        | null;

      return {
        _id: String(order._id),
        total: order.total,
        createdAt: order.createdAt,
        payment: order.payment,
        fulfillment: order.fulfillment,
        items: order.items,
        shippingAddress: order.shippingAddress,
        user: user
          ? {
              name: user.name || "",
              email: user.email || "",
            }
          : null,
      };
    });

    return NextResponse.json({ orders: serializedOrders });
  } catch (error) {
    console.error("Failed to load orders:", error);

    return NextResponse.json(
      { message: "Failed to load orders." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to place an order." },
        { status: 401 },
      );
    }

    if (!Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Your account has an invalid user ID." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: "Your cart is empty." },
        { status: 400 },
      );
    }

    if (body.items.length > 50) {
      return NextResponse.json(
        { message: "An order cannot contain more than 50 line items." },
        { status: 400 },
      );
    }

    if (body.paymentMethod !== "paypal" && body.paymentMethod !== "card") {
      return NextResponse.json(
        { message: "Please choose PayPal or debit/credit card." },
        { status: 400 },
      );
    }

    if (!hasCompleteShippingAddress(body.shippingAddress)) {
      return NextResponse.json(
        { message: "A complete shipping address is required." },
        { status: 400 },
      );
    }

    const normalizedItems = body.items.map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Math.floor(Number(item.quantity)),
      size: {
        label: String(item.size?.label || "").trim(),
        isCustom: Boolean(item.size?.isCustom),
        measurementType: item.size?.measurementType,
        measurements: normalizeMeasurements(item.size?.measurements),
      },
      color: item.color?.hex
        ? {
            name: String(item.color.name || "").trim(),
            hex: String(item.color.hex || "").trim().toLowerCase(),
          }
        : undefined,
    }));

    for (const item of normalizedItems) {
      if (!Types.ObjectId.isValid(item.productId)) {
        return NextResponse.json(
          { message: "One cart item has an invalid product ID." },
          { status: 400 },
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { message: "Each item quantity must be at least 1." },
          { status: 400 },
        );
      }

      if (!item.size.label) {
        return NextResponse.json(
          { message: "Each item must include a selected size." },
          { status: 400 },
        );
      }

      if (
        item.size.isCustom &&
        item.size.measurementType !== "top" &&
        item.size.measurementType !== "bottom"
      ) {
        return NextResponse.json(
          { message: "Custom sizes require a measurement type." },
          { status: 400 },
        );
      }

      if (
        item.size.isCustom &&
        Object.keys(item.size.measurements).length === 0
      ) {
        return NextResponse.json(
          { message: "Custom sizes require at least one measurement." },
          { status: 400 },
        );
      }
    }

    await db.connect();

    const productIds = normalizedItems.map(
      (item) => new Types.ObjectId(item.productId),
    );

    const products = await Product.find({
      _id: {
        $in: productIds,
      },
    }).lean();

    const productById = new Map(
      products.map((product) => [String(product._id), product]),
    );

    const orderItems = [];

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        return NextResponse.json(
          { message: "One or more products are no longer available." },
          { status: 409 },
        );
      }

      if (
        !Number.isFinite(product.countInStock) ||
        product.countInStock < item.quantity
      ) {
        return NextResponse.json(
          {
            message: `${product.name} does not have enough stock available.`,
          },
          { status: 409 },
        );
      }

      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
      const productColors = Array.isArray(product.colors)
        ? product.colors
        : [];

      let unitPrice = 0;

      if (item.size.isCustom) {
        unitPrice = Number(productSizes[0]?.price ?? 0);
      } else {
        const selectedSize = productSizes.find(
          (size: { size?: string }) =>
            String(size.size || "").trim() === item.size.label,
        );

        if (!selectedSize) {
          return NextResponse.json(
            {
              message: `${product.name}: the selected size is unavailable.`,
            },
            { status: 409 },
          );
        }

        unitPrice = Number(selectedSize.price ?? 0);
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json(
          {
            message: `${product.name}: the current price is unavailable.`,
          },
          { status: 409 },
        );
      }

      let colorSnapshot: { name: string; hex: string } | undefined;

      if (item.color?.hex) {
        const selectedColor = productColors.find(
          (color: { hex?: string }) =>
            String(color.hex || "").trim().toLowerCase() === item.color?.hex,
        );

        if (!selectedColor) {
          return NextResponse.json(
            {
              message: `${product.name}: the selected color is unavailable.`,
            },
            { status: 409 },
          );
        }

        colorSnapshot = {
          name: String(selectedColor.name || "").trim(),
          hex: String(selectedColor.hex || "").trim().toLowerCase(),
        };
      }

      const image = product.images?.[0];

      if (!image?.url) {
        return NextResponse.json(
          { message: `${product.name}: product image is unavailable.` },
          { status: 409 },
        );
      }

      const sellerId = product.addedBy;

      if (!sellerId || !Types.ObjectId.isValid(String(sellerId))) {
        return NextResponse.json(
          { message: `${product.name}: seller information is unavailable.` },
          { status: 409 },
        );
      }

      orderItems.push({
        productId: product._id,
        sellerId: new Types.ObjectId(String(sellerId)),
        name: String(product.name || "").trim(),
        slug: String(product.slug || "").trim(),
        image: {
          url: String(image.url).trim(),
          public_id: String(image.public_id || "").trim(),
        },
        size: {
          label: item.size.isCustom ? "Custom size" : item.size.label,
          isCustom: item.size.isCustom,
          measurementType: item.size.isCustom
            ? item.size.measurementType
            : undefined,
          measurements: item.size.isCustom
            ? item.size.measurements
            : undefined,
        },
        color: colorSnapshot,
        quantity: item.quantity,
        unitPrice: roundMoney(unitPrice),
        total: roundMoney(unitPrice * item.quantity),
      });
    }

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.total, 0),
    );

    const shippingFee = subtotal > 200 ? 0 : 15;
    const tax = roundMoney(subtotal * 0.15);
    const discount = 0;
    const total = roundMoney(subtotal + shippingFee + tax - discount);

    const order = await Order.create({
      userId: new Types.ObjectId(session.user.id),
      items: orderItems,
      subtotal,
      tax,
      shippingFee,
      discount,
      total,
      payment: {
        method: body.paymentMethod,
        status: "pending",
      },
      shippingAddress: {
        fullName: body.shippingAddress.fullName.trim(),
        phone: body.shippingAddress.phone.trim(),
        street: body.shippingAddress.street.trim(),
        city: body.shippingAddress.city.trim(),
        state: body.shippingAddress.state.trim(),
        postalCode: body.shippingAddress.postalCode.trim(),
        country: body.shippingAddress.country.trim(),
      },
      fulfillment: {
        status: "pending",
      },
    });

    if (!order) {
      throw new Error("Order creation did not return an order.");
    }

    return NextResponse.json(
      {
        order: {
          _id: order._id.toString(),
          total: order.total,
          payment: order.payment,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create order:", error);

    return NextResponse.json(
      { message: "Unable to create the order." },
      { status: 500 },
    );
  }
}