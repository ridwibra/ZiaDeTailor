//app/api/banner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server"; 
import Banner from "@/models/Banner";
import db from "@/utils/db";
import { Types } from "mongoose";
import { UserType } from "@/utils/types";
import User from "@/models/User";


interface BannerRequestBody {
  title: string;
  subtitle?: string;
  link?: string;
  order?: number;
  active?: boolean;
  image: {
    url: string;
    public_id: string;
  };
}


export async function POST(req: NextRequest) {
  try {
    await db.connect();
 // Authenticate using your centralized helper [2, 5]
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Cast the user to access custom fields like 'role' [6, 7]
    const user = session.user as typeof session.user & UserType;
    
    // // Authorization check: Only admins or root can create languages
    // if (user.role !== "staff" && user.role !== "admin") {
    //    return NextResponse.json({ message: "Forbidden. Admin access required." }, { status: 403 });
    // }


    // Extract body
    const {
      title,
      subtitle,
      link,
      order,
      active,
      image,
    } = (await req.json()) as BannerRequestBody;

   

    if (!image ) {
      return NextResponse.json(
        {
          error:
            "Banner image is required. Please upload an image before saving.",
        },
        { status: 400 }
      );
    }

    // Create banner
    const newBanner = await Banner.create({
      title,
      subtitle,
      link,
      order,
      active,
      image,
      createdBy:  new Types.ObjectId(user.id),
    });

    await db.disconnect();

    return NextResponse.json(
      {
        message: "Banner created successfully.",
        banner: newBanner,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await db.disconnect();
  }
}


export async function GET(req: NextRequest) {
  try {
    await db.connect();

    //Fetch all banners sorted by order
    const banners = await Banner.find()
      .sort({ createdAt: -1 })
     .populate({path: "createdBy", select: "name email", model: User })
     .lean(); 
    await db.disconnect();
    return NextResponse.json(
      {
        message: "Banners fetched successfully.",
        banners,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    await db.disconnect();
  }
}