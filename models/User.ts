import mongoose, { Schema } from "mongoose";
import { UserType } from "@/utils/types";

const userSchema = new Schema<UserType>(
  {
    // Core Better Auth Fields
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false }, 
    image: { type: String }, 

    // Custom App Fields (Ensure these are in auth.ts additionalFields)
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    },
    avatar: {
      image_url: { type: String },
      public_id: { type: String },
    },
    
    // Metadata & Migration Links
    passwordless: { type: Boolean, default: false },
    betterAuthId: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt [4]
);

// Check if model exists before compiling to support Next.js HMR
const User = mongoose.models.User || mongoose.model<UserType>("User", userSchema, "user");
export default User;