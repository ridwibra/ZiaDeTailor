import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
  title: string;
  subtitle: string;
  image: {
    url: string;
    public_id: string;
  };
  link: string;
  order: number;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String },
    subtitle: { type: String },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    link: { type: String },
    order: { type: Number},
    active: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Banner ||
  mongoose.model<IBanner>("Banner", BannerSchema);
