import mongoose, { Schema, model, models, Types } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sellerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },       // snapshot
    slug: { type: String, required: true },       // snapshot

    size: {
      label: { type: String, required: true },    // e.g. "M"
      price: { type: Number, required: true },    // snapshot
    },

    color: {
      name: { type: String, required: true },     // e.g. "Red"
      hex: { type: String, required: true },
    },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    quantity: { type: Number, required: true },

    unitPrice: { type: Number, required: true },  // size.price snapshot
    total: { type: Number, required: true },      // quantity * unitPrice
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    method: { type: String, required: true },     // "stripe", "paypal", "cod"
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const fulfillmentSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: { type: String },
    carrier: { type: String },                   // UPS, FedEx, DHL
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    payment: {
      type: paymentSchema,
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    fulfillment: {
      type: fulfillmentSchema,
      default: () => ({}),
    },

    notes: { type: String },
  },
  { timestamps: true }
);

const Order = models.Order || model("Order", orderSchema);
export default Order;
