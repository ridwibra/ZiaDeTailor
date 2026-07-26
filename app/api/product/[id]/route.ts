// app/api/product/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server";
import db from "@/utils/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { UserType } from "@/utils/types";

/* GET PRODUCT BY ID */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await db.connect();

    const product = await Product.findById(id)
      .populate({
        path: "addedBy",
        select: "name email role",
        model: User,
      })
      .lean();

    await db.disconnect();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Product fetched successfully.",
        product,
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

/* UPDATE PRODUCT BY ID */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await db.connect();

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = session.user as typeof session.user & UserType;

    if (user.role !== "staff" && user.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Staff/Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          images: body.images,
          category: body.category,
          subcategory: body.subcategory,
          tags: body.tags,
          sizes: body.sizes,
          colors: body.colors,
          countInStock: body.countInStock,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    await db.disconnect();

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Product updated successfully.",
        product: updatedProduct,
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

/* DELETE PRODUCT BY ID */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await db.connect();

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = session.user as typeof session.user & UserType;

    if (user.role !== "staff" && user.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Staff/Admin access required." },
        { status: 403 }
      );
    }

    const deleted = await Product.findByIdAndDelete(id);

    await db.disconnect();

    if (!deleted) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Product deleted successfully.",
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
