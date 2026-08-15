// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";

import { getSession } from "@/lib/server";
import db from "@/utils/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { UserType } from "@/utils/types";

type ProductField =
  | "name"
  | "slug"
  | "description"
  | "category"
  | "subcategory"
  | "tags"
  | "sizes"
  | "colors"
  | "images"
  | "countInStock"
  | "general";

type ProductFieldErrors = Partial<Record<ProductField, string>>;

type ProductRequestBody = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  category?: unknown;
  subcategory?: unknown;
  tags?: unknown;
  sizes?: unknown;
  colors?: unknown;
  images?: unknown;
  countInStock?: unknown;
};

type ValidProductData = {
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  sizes: {
    size: string;
    price: number;
  }[];
  colors: {
    name: string;
    hex: string;
  }[];
  images: {
    url: string;
    public_id: string;
  }[];
  countInStock: number;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateProductBody = (
  body: ProductRequestBody,
): {
  fieldErrors: ProductFieldErrors;
  data: ValidProductData | null;
} => {
  const fieldErrors: ProductFieldErrors = {};

  const name = getString(body.name);
  const slug = getString(body.slug).toLowerCase();
  const description = getString(body.description);
  const category = getString(body.category);
  const subcategory = getString(body.subcategory);

  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const sizes = Array.isArray(body.sizes)
    ? body.sizes
        .filter(isObject)
        .map((size) => ({
          size: getString(size.size),
          price: Number(size.price),
        }))
    : [];

  const colors = Array.isArray(body.colors)
    ? body.colors
        .filter(isObject)
        .map((color) => ({
          name: getString(color.name),
          hex: getString(color.hex),
        }))
    : [];

  const images = Array.isArray(body.images)
    ? body.images
        .filter(isObject)
        .map((image) => ({
          url: getString(image.url),
          public_id: getString(image.public_id),
        }))
    : [];

  const countInStock = Number(body.countInStock);

  if (!name) {
    fieldErrors.name = "Product name is required.";
  }

  if (!slug) {
    fieldErrors.slug = "Product slug is required.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug =
      "Slug can only contain lowercase letters, numbers, and single hyphens.";
  }

  if (!description) {
    fieldErrors.description = "Product description is required.";
  }

  if (!category) {
    fieldErrors.category = "Please select a category.";
  }

  if (!subcategory) {
    fieldErrors.subcategory = "Please select a subcategory.";
  }

  if (!Number.isInteger(countInStock) || countInStock < 0) {
    fieldErrors.countInStock =
      "Count in stock must be a whole number that is zero or greater.";
  }

  if (sizes.length === 0) {
    fieldErrors.sizes = "Please add at least one product size.";
  } else if (
    sizes.some(
      (size) =>
        !size.size ||
        !Number.isFinite(size.price) ||
        size.price < 0,
    )
  ) {
    fieldErrors.sizes =
      "Every size must have a name and a valid price of zero or greater.";
  }

  if (
    colors.some(
      (color) =>
        !color.name ||
        !/^#[0-9A-Fa-f]{6}$/.test(color.hex),
    )
  ) {
    fieldErrors.colors =
      "Every color must include a name and a valid hexadecimal color.";
  }

  if (images.length === 0) {
    fieldErrors.images = "Please add at least one product image.";
  } else if (images.some((image) => !image.url || !image.public_id)) {
    fieldErrors.images =
      "Each product image must include a URL and Cloudinary public ID.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      data: null,
    };
  }

  return {
    fieldErrors,
    data: {
      name,
      slug,
      description,
      category,
      subcategory,
      tags,
      sizes,
      colors,
      images,
      countInStock,
    },
  };
};

const getMongooseFieldErrors = (
  error: unknown,
): ProductFieldErrors => {
  if (!(error instanceof mongoose.Error.ValidationError)) {
    return {};
  }

  const fieldErrors: ProductFieldErrors = {};

  for (const [path, validationError] of Object.entries(error.errors)) {
    const field = path.split(".")[0] as ProductField;

    if (
      field === "name" ||
      field === "slug" ||
      field === "description" ||
      field === "category" ||
      field === "subcategory" ||
      field === "tags" ||
      field === "sizes" ||
      field === "colors" ||
      field === "images" ||
      field === "countInStock"
    ) {
      fieldErrors[field] = validationError.message;
    }
  }

  return fieldErrors;
};

const isDuplicateKeyError = (
  error: unknown,
): error is { code: number } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

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

    if (user.role !== "staff" && user.role !== "admin") {
      return NextResponse.json(
        {
          field: "general",
          message: "Staff or admin access is required.",
        },
        { status: 403 },
      );
    }

    const body = (await req.json()) as ProductRequestBody;
    const { fieldErrors, data } = validateProductBody(body);

    if (!data) {
      return NextResponse.json(
        {
          fieldErrors,
          message: "Please fix the highlighted fields.",
        },
        { status: 400 },
      );
    }

    const existingProduct = await Product.findOne({
      slug: data.slug,
    }).lean();

    if (existingProduct) {
      return NextResponse.json(
        {
          field: "slug",
          message: "A product with this slug already exists.",
        },
        { status: 409 },
      );
    }

    const newProduct = await Product.create({
      ...data,
      addedBy: new Types.ObjectId(user.id),
    });

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product: newProduct,
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

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          field: "slug",
          message: "A product with this slug already exists.",
        },
        { status: 409 },
      );
    }

    console.error("Create product error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to create product.",
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

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "addedBy",
        select: "name email role",
        model: User,
      })
      .lean();

    return NextResponse.json(
      {
        message: "Products fetched successfully.",
        products,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Fetch products error:", error);

    return NextResponse.json(
      {
        field: "general",
        message: "Failed to fetch products.",
      },
      { status: 500 },
    );
  } finally {
    await db.disconnect();
  }
}