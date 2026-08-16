import { Schema, model, models } from "mongoose";

const customMeasurementsSchema = new Schema(
  {},
  {
    _id: false,
    strict: false,
  },
);

const selectedSizeSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    isCustom: {
      type: Boolean,
      required: true,
      default: false,
    },

    measurementType: {
      type: String,
      enum: ["top", "bottom", "head"],
      required: function () {
        return this.isCustom === true;
      },
    },

    measurements: {
      type: customMeasurementsSchema,
      required: function () {
        return this.isCustom === true;
      },
      validate: {
        validator: function (
          measurements: Record<string, unknown> | undefined,
        ) {
          if (!this.isCustom) {
            return true;
          }

          return (
            measurements !== undefined &&
            Object.keys(measurements).length > 0
          );
        },
        message:
          "Custom-sized order items must include at least one measurement.",
      },
    },
  },
  {
    _id: false,
  },
);

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      public_id: {
        type: String,
        default: "",
        trim: true,
      },
    },

    size: {
      type: selectedSizeSchema,
      required: true,
    },

    color: {
      name: {
        type: String,
        trim: true,
      },

      hex: {
        type: String,
        trim: true,
      },
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["paypal", "card"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    transactionId: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const shippingAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    street: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const fulfillmentSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    trackingNumber: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    carrier: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    estimatedDelivery: {
      type: Date,
    },

    shippedAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    customerConfirmedAt: {
      type: Date,
    },

    customerComment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one item.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

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
      default: () => ({
        status: "pending",
      }),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "fulfillment.status": 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1, createdAt: -1 });

const Order = models.Order || model("Order", orderSchema);

export default Order;