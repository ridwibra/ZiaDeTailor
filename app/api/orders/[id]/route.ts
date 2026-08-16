import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Types } from "mongoose";

import { auth } from "@/lib/auth";
import db from "@/utils/db";
import Order from "@/models/Order";

type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

const allowedStatuses: FulfillmentStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

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

const serializeOrder = (order: Record<string, any>) => ({
  _id: String(order._id),
  total: order.total,
  subtotal: order.subtotal,
  tax: order.tax,
  shippingFee: order.shippingFee,
  discount: order.discount,
  createdAt: order.createdAt,
  payment: order.payment,
  fulfillment: order.fulfillment,
  shippingAddress: order.shippingAddress,
  items: order.items,
  user: order.userId
    ? {
        name: order.userId.name || "",
        email: order.userId.email || "",
      }
    : null,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid order ID." },
        { status: 400 },
      );
    }

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

    await db.connect();

    const order = await Order.findById(id)
      .populate({
        path: "userId",
        select: "name email",
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    const isOwner = String(order.userId?._id || order.userId) === session.user.id;

    if (!isOwner && !isStaffOrAdmin(role)) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 403 },
      );
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Failed to load order:", error);

    return NextResponse.json(
      { message: "Failed to load order." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid order ID." },
        { status: 400 },
      );
    }

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
    const body = await request.json();

    await db.connect();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }

    const isOwner = String(order.userId) === session.user.id;

    if (body.action === "confirm-receipt") {
      if (!isOwner) {
        return NextResponse.json(
          { message: "You can only confirm receipt of your own order." },
          { status: 403 },
        );
      }

      if (order.fulfillment?.status !== "delivered") {
        return NextResponse.json(
          {
            message:
              "This order must be marked delivered before you can confirm receipt.",
          },
          { status: 409 },
        );
      }

      const comment = String(body.comment || "").trim();

      if (comment.length > 1000) {
        return NextResponse.json(
          { message: "Comment cannot exceed 1000 characters." },
          { status: 400 },
        );
      }

      order.fulfillment.customerConfirmedAt = new Date();

      if (comment) {
        order.fulfillment.customerComment = comment;
      }

      await order.save();

      return NextResponse.json({
        order: {
          _id: order._id.toString(),
          fulfillment: order.fulfillment,
        },
      });
    }

    if (!isStaffOrAdmin(role)) {
      return NextResponse.json(
        { message: "Only admin or staff can update order status." },
        { status: 403 },
      );
    }

    const status = body.status as FulfillmentStatus;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid fulfillment status." },
        { status: 400 },
      );
    }

    const trackingNumber = String(body.trackingNumber || "").trim();
    const carrier = String(body.carrier || "").trim();

    order.fulfillment.status = status;
    order.fulfillment.trackingNumber = trackingNumber || undefined;
    order.fulfillment.carrier = carrier || undefined;

    if (status === "shipped" && !order.fulfillment.shippedAt) {
      order.fulfillment.shippedAt = new Date();
    }

    if (status === "delivered" && !order.fulfillment.deliveredAt) {
      order.fulfillment.deliveredAt = new Date();
    }

    await order.save();

    return NextResponse.json({
      order: {
        _id: order._id.toString(),
        fulfillment: order.fulfillment,
      },
    });
  } catch (error) {
    console.error("Failed to update order:", error);

    return NextResponse.json(
      { message: "Failed to update order." },
      { status: 500 },
    );
  }
}