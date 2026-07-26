// app/api/cron/route.ts
import { NextResponse } from "next/server";
import db from "@/utils/db"; // optional: only if you need to ensure DB connection
import User from "@/models/User";
import { sendEmail } from "@/utils/sendEmail";
import { accountDeletedTemplate } from "@/utils/emails/accountDeletedTemplate";
import { deleteMedia } from "@/utils/files/requests";

/**
 * Next.js Route Handler for automated user cleanup.
 * - Protects the endpoint with Authorization: Bearer <CRON_SECRET>
 * - Finds unverified users older than 24 hours and:
 *    1) deletes their avatar media (if any),
 *    2) emails them a deletion notification,
 *    3) deletes the user document.
 *
 * Notes:
 * - Call this endpoint from a scheduler (daily on Vercel Hobby, or hourly via external scheduler).
 * - Ensure CRON_SECRET is set in Vercel / your scheduler secrets.
 */
export async function GET(req: Request) {
  // 0. Optional: ensure DB connection (uncomment if using a db util)
  try {
    if (typeof db?.connect === "function") {
      await db.connect();
    }
  } catch (connErr) {
    console.error("DB connect failed:", connErr);
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  // 1. Security Check: Validate the incoming request against your secret.
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim(); // tolerant parsing

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Identify users who haven't verified within the 24-hour window.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredUsers = await User.find({
      emailVerified: false,
      createdAt: { $lt: twentyFourHoursAgo },
    }).lean();

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0, message: "No expired unverified users found." });
    }

    // 3. Process each expired user for cleanup.
    const errors: { email?: string; id?: string; error: string }[] = [];
    const processedIds: string[] = [];

    // We process serially to avoid hitting Cloudinary rate limits; if you have high volume,
    // consider batching with a small concurrency limit (p-map or Promise pool).
    for (const user of expiredUsers) {
      try {
        // A: Delete avatar if present
        if (user.avatar?.public_id) {
          try {
            await deleteMedia(user.avatar.public_id);
          } catch (cloudErr) {
            // Log but continue
            console.error(`Cloud deletion failed for ${user.email} (${user._id}):`, cloudErr);
            errors.push({ email: user.email, id: String(user._id), error: `media-delete-failed: ${String(cloudErr)}` });
            // continue cleanup of DB and email even if media deletion fails
          }
        }

        // B: Notify the user (best-effort)
        try {
          await sendEmail(
            user.email,
            "", // plain text fallback (your sendEmail util may accept different args)
            "",
            "Account Deleted: Verification Expired",
            () => accountDeletedTemplate(user.name || "", user.email)
          );
        } catch (emailErr) {
          console.error(`Failed to send deletion email to ${user.email}:`, emailErr);
          errors.push({ email: user.email, id: String(user._id), error: `email-failed: ${String(emailErr)}` });
        }

        // C: Delete the user document
        await User.deleteOne({ _id: user._id });
        processedIds.push(String(user._id));
      } catch (userErr) {
        console.error(`Failed to cleanup user ${user.email} (${user._id}):`, userErr);
        errors.push({ email: user.email, id: String(user._id), error: String(userErr) });
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: processedIds.length,
      deletedIds: processedIds,
      errors,
    });
  } catch (err) {
    console.error("User cleanup task failed:", err);
    return NextResponse.json({ error: "Cleanup failed", detail: String(err) }, { status: 500 });
  } finally {
    // Optional: close DB connection if your db util exposes disconnect
    try {
      if (typeof db?.disconnect === "function") {
        await db.disconnect();
      }
    } catch (discErr) {
      console.warn("DB disconnect failed:", discErr);
    }
  }
}