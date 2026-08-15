import { Schema, model, models, Types } from "mongoose";

const sizeSchema = new Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const colorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hex: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/,
    },
  },
  { _id: false },
);

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    public_id: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const reviewSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Comment must contain at least 2 characters."],
      maxlength: [1000, "Comment cannot exceed 1000 characters."],
    },
  },
  {
    timestamps: true,
  },
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subcategory: {
      type: String,
      required: true,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) =>
        Array.isArray(tags)
          ? tags
              .filter((tag) => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
    },

    sizes: {
      type: [sizeSchema],
      default: [],
    },

    colors: {
      type: [colorSchema],
      default: [],
    },

    images: {
      type: [imageSchema],
      default: [],
    },

    reviews: {
      type: [reviewSchema],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    views: {
      type: Number,
      default: 0,
    },

    sales: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    addedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Product = models.Product || model("Product", productSchema);

export default Product;