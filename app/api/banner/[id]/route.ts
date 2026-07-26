//app/api/banner/route.ts

import { NextRequest, NextResponse } from "next/server";
import db from "@/utils/db";
import Banner from "@/models/Banner";
import { getSession } from "@/lib/server";
import { UserType } from "@/utils/types";

// Only staff or admin can modify banners
function isStaffOrAdmin(role?: string) {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "staff" || r === "admin";
}


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.connect();

    const banner = await Banner.findById(id).populate(
      "createdBy",
      "name email role"
    );

    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Banner fetched successfully.", banner },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await db.disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.connect();

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = session.user as typeof session.user & UserType;

    if (!isStaffOrAdmin(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Staff or admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subtitle, link, order, active, image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Banner image is required." },
        { status: 400 }
      );
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        title: title?.trim(),
        subtitle: subtitle?.trim() || "",
        link: link?.trim() || "",
        order,
        active,
        image,
      },
      { new: true }
    );

    if (!updatedBanner) {
      return NextResponse.json(
        { error: "Banner not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Banner updated successfully.", banner: updatedBanner },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await db.disconnect();
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 

    console.log("DELETE banner start, id:", id);

    await db.connect();

    const session = await getSession();

    if (!session) {
      console.warn("Unauthorized: no session");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const user = session.user as typeof session.user & UserType;

    if (!isStaffOrAdmin(user.role)) {
      console.warn("Unauthorized: role =", user.role);
      return NextResponse.json(
        { error: "Unauthorized. Staff or admin access required." },
        { status: 403 }
      );
    }

    const bannerBefore = await Banner.findById(id).exec();

    if (!bannerBefore) {
      console.warn("Banner not found:", id);
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    const deletedBanner = await Banner.findByIdAndDelete(id);
    console.log("Deleted banner:", deletedBanner?._id || null);

    return NextResponse.json(
      { message: "Banner deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete banner error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  } finally {
    await db.disconnect();
  }
}