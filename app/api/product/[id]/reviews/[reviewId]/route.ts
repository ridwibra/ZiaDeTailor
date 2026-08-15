// app/api/product/[id]/reviews/[reviewId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getSession } from "@/lib/server";
import db from "@/utils/db";
import Product from "@/models/Product";
import { UserType } from "@/utils/types";

type ReviewUpdateBody = {
  rating?: unknown;
  comment?: unknown;
};

type ReviewLike = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const calculateReviewSummary = (reviews: ReviewLike[]) => {
  const numReviews = reviews.length;

  const rating =
    numReviews > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        numReviews
      : 0;

  return {
    numReviews,
    rating,
  };
};

const validateReviewBody = (body: ReviewUpdateBody) => {
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

  return {
    rating,
    comment,
    fieldErrors,
  };
};

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ id: string; reviewId: string }>;
  },
) {
  try {
    const { id, reviewId } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Invalid review ID.",
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
          message: "Please sign in to edit your review.",
        },
        { status: 401 },
      );
    }

    const user = session.user as typeof session.user & UserType;
    const body = (await req.json()) as ReviewUpdateBody;

    const { rating, comment, fieldErrors } = validateReviewBody(body);

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

    if (!Array.isArray(product.reviews)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Review not found.",
        },
        { status: 404 },
      );
    }

    const review = product.reviews.id(reviewId) as ReviewLike | null;

    if (!review) {
      return NextResponse.json(
        {
          field: "general",
          message: "Review not found.",
        },
        { status: 404 },
      );
    }

    if (review.user.toString() !== user.id) {
      return NextResponse.json(
        {
          field: "general",
          message: "You can only edit your own review.",
        },
        { status: 403 },
      );
    }

    review.rating = rating;
    review.comment = comment;

    product.markModified("reviews");

    const summary = calculateReviewSummary(
      product.reviews as unknown as ReviewLike[],
    );

    product.numReviews = summary.numReviews;
    product.rating = summary.rating;

    await product.save();

    const updatedReview =
      typeof (review as unknown as { toObject?: () => unknown }).toObject ===
      "function"
        ? (review as unknown as { toObject: () => unknown }).toObject()
        : review;

    return NextResponse.json(
      {
        message: "Review updated successfully.",
        review: updatedReview,
        rating: product.rating,
        numReviews: product.numReviews,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Update review error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to update review.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}

export async function DELETE(
  _req: NextRequest,
  context: {
    params: Promise<{ id: string; reviewId: string }>;
  },
) {
  try {
    const { id, reviewId } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Invalid review ID.",
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
          message: "Please sign in to delete your review.",
        },
        { status: 401 },
      );
    }

    const user = session.user as typeof session.user & UserType;

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

    if (!Array.isArray(product.reviews)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Review not found.",
        },
        { status: 404 },
      );
    }

    const review = product.reviews.id(reviewId) as ReviewLike | null;

    if (!review) {
      return NextResponse.json(
        {
          field: "general",
          message: "Review not found.",
        },
        { status: 404 },
      );
    }

    if (review.user.toString() !== user.id) {
      return NextResponse.json(
        {
          field: "general",
          message: "You can only delete your own review.",
        },
        { status: 403 },
      );
    }

    product.reviews = product.reviews.filter(
      (item: { _id: Types.ObjectId }) =>
        item._id.toString() !== reviewId,
    );

    product.markModified("reviews");

    const summary = calculateReviewSummary(
      product.reviews as unknown as ReviewLike[],
    );

    product.numReviews = summary.numReviews;
    product.rating = summary.rating;

    await product.save();

    return NextResponse.json(
      {
        message: "Review deleted successfully.",
        rating: product.rating,
        numReviews: product.numReviews,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Delete review error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to delete review.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}