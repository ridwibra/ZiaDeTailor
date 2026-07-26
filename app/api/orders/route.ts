import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import Order from "@/models/Order";
import { Types } from "mongoose";
import db from "@/utils/db";

// GET /api/orders
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = (session?.user as { role?: "user" | "staff" | "admin" } | undefined)?.role;

    if (!session || (role !== "admin" && role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.connect();

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalPrice: 1,
          isPaid: 1,
          isDelivered: 1,
          paidAt: 1,
          deliveredAt: 1,
          createdAt: 1,
          status: 1,
          "user.name": 1,
          "user.email": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to load orders:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = (session?.user as { role?: "user" | "staff" | "admin" } | undefined)?.role;

    if (!session || (role !== "admin" && role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.connect()
    const body = await req.json();

    const order = await Order.create({
      ...body,
      user: new Types.ObjectId(body.user),
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}