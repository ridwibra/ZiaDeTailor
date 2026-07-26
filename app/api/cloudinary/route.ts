// app/api/cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  CloudinaryUploadResult,
} from "@/utils/files/cloudinary";
import { validateMediaFiles } from "@/utils/files/validateFileFormat";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";


type CloudinaryErrorResponse = { message: string };
type CloudinarySuccessResponse = { success: boolean };

export const runtime = "nodejs";

// Hard limits for safety
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(
  req: NextRequest
): Promise<NextResponse<CloudinaryUploadResult[] | CloudinaryErrorResponse>> {
  try {
    const formData = await req.formData();
    const files: File[] = [];
    let path: string | undefined;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      } else if (key === "path" && typeof value === "string") {
        path = value;
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ message: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { message: `Too many files. Max allowed is ${MAX_FILES}` },
        { status: 400 }
      );
    }

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { message: "Total upload size exceeds limit" },
        { status: 400 }
      );
    }

    // Prepare for validation
    const uploadFiles = files.map((file) => ({
      mimetype: file.type,
      size: file.size,
      name: file.name,
    }));

    const validation = await validateMediaFiles(uploadFiles);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.message || "Invalid files" },
        { status: 400 }
      );
    }

    // Upload sequentially (safer than Promise.all)
    const results: CloudinaryUploadResult[] = [];
    for (const file of files) {
      const result = await uploadToCloudinary(file, path);
      results.push(result);
    }

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<CloudinarySuccessResponse | CloudinaryErrorResponse>> {
  try {

     const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    const public_id = data.public_id;

    if (!public_id) {
      return NextResponse.json(
        { message: "No public_id provided" },
        { status: 400 }
      );
    }

    await deleteFromCloudinary(public_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    console.error("Cloudinary delete error:", error);
    return NextResponse.json({ message }, { status: 500 });
}}
