// utils/files/cloudinary.ts

import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

if (
  !process.env.CLOUDINARY_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary configuration is missing");
}

export type CloudinaryUploadResult = {
  url: string;
  public_id: string;
};

type ResourceType = "image" | "video" | "raw" | "auto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

 const getResourceType = (mimeType: string): ResourceType => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "raw";
  if (mimeType.startsWith("application/") || mimeType.startsWith("text/"))
    return "raw";
  return "auto";
};

export const uploadToCloudinary = async (
  file: File,
  path?: string
): Promise<CloudinaryUploadResult> => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
  await fs.writeFile(tempFilePath, buffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      tempFilePath,
      {
        folder: path,

        resource_type: getResourceType(file.type),
   
        invalidate: true,
      },
      (error, result) => {
        fs.unlink(tempFilePath).catch(console.error);

        if (error) {
          reject(new Error(`Upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed: No result returned"));
        }
      }
    );
  });
};

export const deleteFromCloudinary = async (public_id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      public_id,
      { resource_type: "image" }, // <-- change from "auto" to "image"
      (error, result) => {
        if (error) {
          return reject(error);
        }

        // "ok" = deleted, "not found" = already gone → both are fine
        if (result?.result === "ok" || result?.result === "not found") {
          return resolve();
        }

        reject(new Error(`Failed to delete from Cloudinary: ${result?.result}`));
      }
    );
  });
};