import { NextRequest, NextResponse } from "next/server";
import db from "@/utils/db";
import ShippingRate from "@/models/ShippingRate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/*
  GET /api/shipping

  Query options:
  - /api/shipping              -> returns all rates
  - /api/shipping?active=true  -> returns active rates only

  For your checkout page, use:
  /api/shipping?active=true
*/
export async function GET(request: NextRequest) {
  try {
    const activeOnly =
      request.nextUrl.searchParams.get("active") === "true";

    await db.connect();

    const filter = activeOnly ? { isActive: true } : {};

    const rates = await ShippingRate.find(filter)
      .sort({ place: 1, carrier: 1 })
      .lean();

    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Failed to load shipping rates:", error);

    return NextResponse.json(
      { error: "Unable to load shipping rates." },
      { status: 500 },
    );
  }
}

/*
  POST /api/shipping

  Body example:
  {
    "place": "Lagos Island",
    "price": 15,
    "carrier": "DHL",
    "isActive": true
  }
*/
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const place = cleanText(data.place);
    const carrier = cleanText(data.carrier);
    const price = parsePrice(data.price);
    const isActive =
      typeof data.isActive === "boolean" ? data.isActive : true;

    if (place.length < 2 || place.length > 120) {
      return NextResponse.json(
        { error: "Place must be between 2 and 120 characters." },
        { status: 400 },
      );
    }

    if (carrier.length > 120) {
      return NextResponse.json(
        { error: "Carrier must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Shipping price must be a number of 0 or more." },
        { status: 400 },
      );
    }

    await db.connect();

    const existingRate = await ShippingRate.findOne({
      place: {
        $regex: `^${escapeRegex(place)}$`,
        $options: "i",
      },
      carrier: {
        $regex: `^${escapeRegex(carrier)}$`,
        $options: "i",
      },
    }).lean();

    if (existingRate) {
      return NextResponse.json(
        {
          error:
            "A shipping rate with this place and carrier already exists.",
        },
        { status: 409 },
      );
    }

    const rate = await ShippingRate.create({
      place,
      price,
      carrier,
      isActive,
    });

    return NextResponse.json({ rate }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create shipping rate:", error);

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
      { error: "Unable to create shipping rate." },
      { status: 500 },
    );
  }
}