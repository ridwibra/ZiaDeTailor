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
    title: {
      type: String,
      required: [true, "Banner title is required."],
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: [true, "Banner image URL is required."],
        trim: true,
      },

      public_id: {
        type: String,
        required: [true, "Banner image public ID is required."],
        trim: true,
      },
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
      min: [0, "Banner order cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Banner order must be a whole number.",
      },
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Banner =
  mongoose.models.Banner ||
  mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;