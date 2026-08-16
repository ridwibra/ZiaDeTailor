import { Schema, model, models } from "mongoose";

const shippingRateSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    carrier: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

shippingRateSchema.index(
  { place: 1, carrier: 1 },
  { unique: true },
);

const ShippingRate =
  models.ShippingRate ||
  model("ShippingRate", shippingRateSchema);

export default ShippingRate;