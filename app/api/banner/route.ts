//app/api/banner/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";

import { getSession } from "@/lib/server";
import Banner from "@/models/Banner";
import db from "@/utils/db";
import { UserType } from "@/utils/types";
import User from "@/models/User";

type BannerField =
  | "title"
  | "subtitle"
  | "link"
  | "order"
  | "active"
  | "image"
  | "general";

type BannerFieldErrors = Partial<Record<BannerField, string>>;

type BannerRequestBody = {
  title?: unknown;
  subtitle?: unknown;
  link?: unknown;
  order?: unknown;
  active?: unknown;
  image?: unknown;
};

type BannerData = {
  title: string;
  subtitle: string;
  link: string;
  order: number;
  active: boolean;
  image: {
    url: string;
    public_id: string;
  };
};

const isStaffOrAdmin = (role?: string) => {
  if (!role) return false;

  const normalizedRole = role.toLowerCase();

  return normalizedRole === "staff" || normalizedRole === "admin";
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateBannerBody = (
  body: BannerRequestBody,
): {
  fieldErrors: BannerFieldErrors;
  data: BannerData | null;
} => {
  const fieldErrors: BannerFieldErrors = {};

  const title = getString(body.title);
  const subtitle = getString(body.subtitle);
  const link = getString(body.link);
  const order = Number(body.order);

  const active =
    typeof body.active === "boolean" ? body.active : undefined;

  const image = isObject(body.image) ? body.image : null;
  const imageUrl = image ? getString(image.url) : "";
  const imagePublicId = image ? getString(image.public_id) : "";

  if (!title) {
    fieldErrors.title = "Banner title is required.";
  } else if (title.length > 120) {
    fieldErrors.title = "Banner title cannot exceed 120 characters.";
  }

  if (subtitle.length > 240) {
    fieldErrors.subtitle = "Banner subtitle cannot exceed 240 characters.";
  }

  if (!Number.isInteger(order) || order < 0) {
    fieldErrors.order =
      "Banner order must be a whole number that is zero or greater.";
  }

  if (active === undefined) {
    fieldErrors.active = "Banner active status must be true or false.";
  }

  if (!imageUrl || !imagePublicId) {
    fieldErrors.image =
      "A valid banner image with a URL and Cloudinary public ID is required.";
  }

  if (Object.keys(fieldErrors).length > 0 || active === undefined) {
    return {
      fieldErrors,
      data: null,
    };
  }

  return {
    fieldErrors,
    data: {
      title,
      subtitle,
      link,
      order,
      active,
      image: {
        url: imageUrl,
        public_id: imagePublicId,
      },
    },
  };
};

const getMongooseFieldErrors = (
  error: unknown,
): BannerFieldErrors => {
  if (!(error instanceof mongoose.Error.ValidationError)) {
    return {};
  }

  const fieldErrors: BannerFieldErrors = {};

  for (const [path, validationError] of Object.entries(error.errors)) {
    const rootField = path.split(".")[0] as BannerField;

    if (
      rootField === "title" ||
      rootField === "subtitle" ||
      rootField === "link" ||
      rootField === "order" ||
      rootField === "active" ||
      rootField === "image"
    ) {
      fieldErrors[rootField] = validationError.message;
    }
  }

  return fieldErrors;
};

export async function POST(req: NextRequest) {
  try {
    await db.connect();

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          field: "general",
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 },
      );
    }

    const user = session.user as typeof session.user & UserType;

    if (!isStaffOrAdmin(user.role)) {
      return NextResponse.json(
        {
          field: "general",
          message: "Staff or admin access is required.",
        },
        { status: 403 },
      );
    }

    const body = (await req.json()) as BannerRequestBody;
    const { fieldErrors, data } = validateBannerBody(body);

    if (!data) {
      return NextResponse.json(
        {
          fieldErrors,
          message: "Please fix the highlighted fields.",
        },
        { status: 400 },
      );
    }

    const banner = await Banner.create({
      ...data,
      createdBy: new Types.ObjectId(user.id),
    });

    return NextResponse.json(
      {
        message: "Banner created successfully.",
        banner,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const fieldErrors = getMongooseFieldErrors(error);

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          fieldErrors,
          message: "Please fix the highlighted fields.",
        },
        { status: 400 },
      );
    }

    console.error("Create banner error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to create banner.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}

export async function GET() {
  try {
    await db.connect();

    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "name email role",
        model: User,
      })
      .lean();

    return NextResponse.json(
      {
        message: "Banners fetched successfully.",
        banners,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Fetch banners error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to fetch banners.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}