import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import db from "@/utils/db";
import ShippingRate from "@/models/ShippingRate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function cleanText(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

function parsePrice(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return Number.NaN;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getShippingRateId(
  context: RouteContext,
): Promise<string | null> {
  const { id } = await context.params;

  return Types.ObjectId.isValid(id) ? id : null;
}

/*
  GET /api/shipping/:id
*/
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const id = await getShippingRateId(context);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid shipping rate ID." },
        { status: 400 },
      );
    }

    await db.connect();

    const rate = await ShippingRate.findById(id).lean();

    if (!rate) {
      return NextResponse.json(
        { error: "Shipping rate not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Failed to get shipping rate:", error);

    return NextResponse.json(
      { error: "Unable to load shipping rate." },
      { status: 500 },
    );
  }
}

/*
  PATCH /api/shipping/:id

  Send only fields you want to update.

  Example:
  {
    "place": "Abuja",
    "price": 25,
    "carrier": "GIG Logistics",
    "isActive": true
  }
*/
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const id = await getShippingRateId(context);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid shipping rate ID." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if ("place" in data) {
      const place = cleanText(data.place);

      if (place.length < 2 || place.length > 120) {
        return NextResponse.json(
          { error: "Place must be between 2 and 120 characters." },
          { status: 400 },
        );
      }

      updates.place = place;
    }

    if ("carrier" in data) {
      const carrier = cleanText(data.carrier);

      if (carrier.length > 120) {
        return NextResponse.json(
          { error: "Carrier must be 120 characters or fewer." },
          { status: 400 },
        );
      }

      updates.carrier = carrier;
    }

    if ("price" in data) {
      const price = parsePrice(data.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Shipping price must be a number of 0 or more." },
          { status: 400 },
        );
      }

      updates.price = price;
    }

    if ("isActive" in data) {
      if (typeof data.isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be true or false." },
          { status: 400 },
        );
      }

      updates.isActive = data.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 },
      );
    }

    await db.connect();

    const currentRate = await ShippingRate.findById(id).lean();

    if (!currentRate) {
      return NextResponse.json(
        { error: "Shipping rate not found." },
        { status: 404 },
      );
    }

    const finalPlace =
      typeof updates.place === "string"
        ? updates.place
        : currentRate.place;

    const finalCarrier =
      typeof updates.carrier === "string"
        ? updates.carrier
        : currentRate.carrier;

    const conflictingRate = await ShippingRate.findOne({
      _id: { $ne: id },
      place: {
        $regex: `^${escapeRegex(finalPlace)}$`,
        $options: "i",
      },
      carrier: {
        $regex: `^${escapeRegex(finalCarrier)}$`,
        $options: "i",
      },
    }).lean();

    if (conflictingRate) {
      return NextResponse.json(
        {
          error:
            "A shipping rate with this place and carrier already exists.",
        },
        { status: 409 },
      );
    }

    const rate = await ShippingRate.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return NextResponse.json({ rate });
  } catch (error: unknown) {
    console.error("Failed to update shipping rate:", error);

    const duplicateKey =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;

    if (duplicateKey) {
      return NextResponse.json(
        {
          error:
            "A shipping rate with this place and carrier already exists.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update shipping rate." },
      { status: 500 },
    );
  }
}

/*
  DELETE /api/shipping/:id
*/
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const id = await getShippingRateId(context);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid shipping rate ID." },
        { status: 400 },
      );
    }

    await db.connect();

    const rate = await ShippingRate.findByIdAndDelete(id).lean();

    if (!rate) {
      return NextResponse.json(
        { error: "Shipping rate not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Shipping rate deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete shipping rate:", error);

    return NextResponse.json(
      { error: "Unable to delete shipping rate." },
      { status: 500 },
    );
  }
}