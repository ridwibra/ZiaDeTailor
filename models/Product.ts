import mongoose, { Schema, model, models, Types } from "mongoose";

const sizeSchema = new Schema(
  {
    size: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const colorSchema = new Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: { type: String, required: true },

    category: { type: String, required: true },
    subcategory: { type: String, required: true },

    tags: {
      type: [String],
      default: [],
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
},


    addedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Product = models.Product || model("Product", productSchema);
export default Product;
