// app/api/cron/route.ts
import { NextResponse } from "next/server";
import User from "@/models/User";
import { sendEmail } from "@/utils/sendEmail";
import { accountDeletedTemplate } from "@/utils/emails/accountDeletedTemplate";
import { deleteMedia } from "@/utils/files/requests";

/**
 * Next.js Route Handler for automated user cleanup [2], [3].
 * This endpoint should be triggered by an external cron service (e.g., Vercel Cron).
 */
export async function GET(req: Request) {
  // 1. Security Check: Validate the incoming request against your secret.
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Identify users who haven't verified within the 24-hour window.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Mongoose query to find unverified accounts older than 24 hours [1].
    const expiredUsers = await User.find({
      emailVerified: false,
      createdAt: { $lt: twentyFourHoursAgo }
    });

    // 3. Process each expired user for cleanup.
    const cleanupPromises = expiredUsers.map(async (user) => {
      // Step A: Delete the avatar from Cloudinary if a public_id exists.
      if (user.avatar?.public_id) {
        try {
          await deleteMedia(user.avatar.public_id);
        } catch (cloudinaryError) {
          // Log error but continue to ensure the database is cleaned.
          console.error(`Cloudinary deletion failed for ${user.email}:`, cloudinaryError);
        }
      }

      // Step B: Notify the user that their unverified account has been removed.
      // We wrap the template in an arrow function to satisfy the EmailTemplate type.
      await sendEmail(
        user.email,
        "", 
        "",
        "Account Deleted: Verification Expired",
       () => accountDeletedTemplate(user.name, user.email)

      );

      // Step C: Delete the document from the MongoDB collection [1].
      return User.deleteOne({ _id: user._id });
    });

    // Execute all cleanup tasks in parallel for efficiency.
    await Promise.all(cleanupPromises);

    return NextResponse.json({ 
      success: true, 
      deletedCount: expiredUsers.length 
    });

  } catch (error) {
    console.error("User cleanup task failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}