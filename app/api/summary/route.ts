// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import User from "@/models/User";

import Product from "@/models/Product";

import db from "@/utils/db";
import Order from "@/models/Order";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = (session?.user as { role?: "user" | "staff" | "admin" } | undefined)?.role;

    if (!session || (role !== "admin" && role !== "staff")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await db.connect();

    const usersCount = await User.countDocuments({}).exec();
    const productsCount = await Product.countDocuments({}).exec();

    const ordersAgg = await Order.aggregate<{
      total: number | null;
      count: number;
    }>([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const ordersPrice = ordersAgg[0]?.total ?? 0;
    const ordersCount = ordersAgg[0]?.count ?? 0;

    const salesAgg = await Order.aggregate<{ _id: string; totalSales: number }>([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const summary = {
      ordersPrice,
      ordersCount,
      productsCount,
      usersCount,
      salesData: salesAgg.map((x) => ({
        _id: x._id,
        totalSales: x.totalSales,
      })),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to load summary:", error);
    return NextResponse.json(
      { message: "Failed to load summary" },
      { status: 500 }
    );
  }
}