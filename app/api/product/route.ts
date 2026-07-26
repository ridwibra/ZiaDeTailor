// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server";
import db from "@/utils/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { Types } from "mongoose";
import { UserType } from "@/utils/types";

export async function POST(req: NextRequest) {
  try {
    await db.connect();

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = session.user as typeof session.user & UserType;
   //Only staff/admin can create products
    if (user.role !== "staff" && user.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Staff/Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      name,
      slug,
      description,
      category,
      subcategory,
      tags,
      sizes,
      colors,
      images, 
    } = body;

    if (!name || !slug || !description || !images || images.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists." },
        { status: 400 }
      );
    }

    const newProduct = await Product.create({
      name,
      slug,
      description,
      category,
      subcategory,
      tags,
      sizes,
      colors,
      images,
      addedBy: new Types.ObjectId(user.id),
    });

    await db.disconnect();

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await db.disconnect();
  }
}

export async function GET() {
  try {
    await db.connect();

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "addedBy",
        select: "name email role",
        model: User,
      })
      .lean();

    await db.disconnect();

    return NextResponse.json(
      {
        message: "Products fetched successfully.",
        products,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await db.disconnect();
  }
}
