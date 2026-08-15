// app/api/product/[id]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getSession } from "@/lib/server";
import db from "@/utils/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { UserType } from "@/utils/types";

type ReviewBody = {
  rating?: unknown;
  comment?: unknown;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    await db.connect();

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          field: "general",
          message: "Please sign in to submit a review.",
        },
        { status: 401 },
      );
    }

    const user = session.user as typeof session.user & UserType;
    const body = (await req.json()) as ReviewBody;

    const rating = Number(body.rating);
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";

    const fieldErrors: Record<string, string> = {};

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      fieldErrors.rating = "Please choose a rating from 1 to 5 stars.";
    }

    if (!comment) {
      fieldErrors.comment = "A review comment is required.";
    } else if (comment.length < 2) {
      fieldErrors.comment =
        "Your review comment must be at least 2 characters.";
    } else if (comment.length > 1000) {
      fieldErrors.comment =
        "Your review comment cannot exceed 1000 characters.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          fieldErrors,
          message: "Please fix the highlighted fields.",
        },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          field: "general",
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    // Supports product documents created before the reviews field existed.
    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    const alreadyReviewed = product.reviews.some(
      (review: { user: Types.ObjectId }) =>
        review.user.toString() === user.id,
    );

    if (alreadyReviewed) {
      return NextResponse.json(
        {
          field: "general",
          message: "You have already reviewed this product.",
        },
        { status: 409 },
      );
    }

    const databaseUser = await User.findById(user.id)
      .select("name")
      .lean();

    const reviewerName =
      databaseUser?.name ||
      session.user.name ||
      "Verified customer";

    product.reviews.push({
      user: new Types.ObjectId(user.id),
      name: reviewerName,
      rating,
      comment,
    });

    product.numReviews = product.reviews.length;

    product.rating =
      product.numReviews > 0
        ? product.reviews.reduce(
            (total: number, review: { rating: number }) =>
              total + review.rating,
            0,
          ) / product.numReviews
        : 0;

    await product.save();

    const latestReview = product.reviews[product.reviews.length - 1];

    const newReview =
      typeof latestReview?.toObject === "function"
        ? latestReview.toObject()
        : latestReview;

    return NextResponse.json(
      {
        message: "Review submitted successfully.",
        review: newReview,
        rating: product.rating,
        numReviews: product.numReviews,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Create review error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to submit review.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}