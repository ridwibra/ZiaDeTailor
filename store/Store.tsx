"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MeasurementType = "top" | "bottom" | "head";

export type CustomMeasurements = Record<string, string>;

export type CartSize = {
  label: string;
  isCustom: boolean;
  measurementType?: MeasurementType;
  measurements?: CustomMeasurements;
};

export type CartColor = {
  name: string;
  hex: string;
};

export type CartImage = {
  url: string;
  public_id: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  image: CartImage;

  // Display estimate only. The checkout API must re-fetch product prices.
  price: number;
  countInStock: number;

  size: CartSize;
  color?: CartColor;
};

export type ShippingAddress = {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  location?: {
    lat?: number;
    lng?: number;
    address?: string;
    name?: string;
    vicinity?: string;
    googleAddressId?: string;
  };
};

export type SelectedShippingRate = {
  _id: string;
  place: string;
  price: number;
  carrier: string;
};

export type PaymentMethod = "paypal" | "card" | "";

type CartStore = {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  shippingRate: SelectedShippingRate | null;
  paymentMethod: PaymentMethod;

  addItem: (item: CartItem) => void;
  removeItem: (item: Pick<CartItem, "productId" | "size" | "color">) => void;
  updateItemQuantity: (
    item: Pick<CartItem, "productId" | "size" | "color">,
    quantity: number,
  ) => void;

  clearItems: () => void;
  resetCart: () => void;

  saveShippingAddress: (address: ShippingAddress) => void;
  saveShippingRate: (shippingRate: SelectedShippingRate | null) => void;
  savePaymentMethod: (paymentMethod: PaymentMethod) => void;
};

const normalizeMeasurements = (
  measurements?: CustomMeasurements,
): CustomMeasurements =>
  Object.fromEntries(
    Object.entries(measurements ?? {})
      .map(([field, value]) => [field, String(value).trim()])
      .filter(([, value]) => value.length > 0)
      .sort(([firstField], [secondField]) =>
        firstField.localeCompare(secondField),
      ),
  );

function isMeasurementType(value: unknown): value is MeasurementType {
  return value === "top" || value === "bottom" || value === "head";
}

function isLegacyCustomSize(label: string): boolean {
  const normalized = label.trim().toLowerCase();

  return normalized === "custom" || normalized === "custom size";
}

function sanitizeShippingRate(value: unknown): SelectedShippingRate | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const rate = value as Partial<SelectedShippingRate>;

  const id = typeof rate._id === "string" ? rate._id.trim() : "";
  const place = typeof rate.place === "string" ? rate.place.trim() : "";
  const carrier = typeof rate.carrier === "string" ? rate.carrier.trim() : "";
  const price = Number(rate.price);

  if (!id || !place || !Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    _id: id,
    place,
    carrier,
    price,
  };
}

export const getCartItemKey = (
  item: Pick<CartItem, "productId" | "size" | "color">,
): string => {
  const measurements = item.size.isCustom
    ? normalizeMeasurements(item.size.measurements)
    : {};

  return JSON.stringify({
    productId: item.productId.trim(),
    size: item.size.label.trim().toLowerCase(),
    isCustom: item.size.isCustom,
    measurementType: item.size.isCustom
      ? (item.size.measurementType ?? "")
      : "",
    measurements,
    color: item.color?.hex?.trim().toLowerCase() ?? "",
  });
};

const sanitizeCartItem = (item: CartItem): CartItem => {
  const label = item.size?.label?.trim() || "";
  const isCustom = Boolean(item.size?.isCustom);

  return {
    ...item,

    productId: item.productId.trim(),
    slug: item.slug.trim(),
    name: item.name.trim(),

    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    price: Math.max(0, Number(item.price) || 0),
    countInStock: Math.max(0, Math.floor(Number(item.countInStock) || 0)),

    image: {
      url: item.image?.url?.trim() || "",
      public_id: item.image?.public_id?.trim() || "",
    },

    size: {
      label,
      isCustom,
      measurementType:
        isCustom && isMeasurementType(item.size?.measurementType)
          ? item.size.measurementType
          : undefined,
      measurements: isCustom
        ? normalizeMeasurements(item.size?.measurements)
        : undefined,
    },

    color: item.color
      ? {
          name: item.color.name?.trim() || "",
          hex: item.color.hex?.trim() || "",
        }
      : undefined,
  };
};

function sanitizePersistedCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is CartItem => typeof item === "object" && item !== null,
    )
    .map(sanitizeCartItem)
    .filter((item) => {
      if (!item.productId || !item.slug || !item.name) {
        return false;
      }

      if (!item.image.url || !item.size.label) {
        return false;
      }

      /*
        Old cart records used:
        { label: "Custom size", isCustom: true }

        Those records do not identify the normal base size,
        so remove them instead of guessing M, L, XL, etc.
      */
      if (item.size.isCustom && isLegacyCustomSize(item.size.label)) {
        return false;
      }

      if (item.size.isCustom) {
        const hasValidMeasurementType = isMeasurementType(
          item.size.measurementType,
        );

        const hasMeasurements =
          Object.keys(item.size.measurements ?? {}).length > 0;

        return hasValidMeasurementType && hasMeasurements;
      }

      return true;
    });
}

export const useStore = create<CartStore>()(
  persist(
    (set) => ({
      cartItems: [],
      shippingAddress: {},
      shippingRate: null,
      paymentMethod: "",

      addItem: (item) => {
        const newItem = sanitizeCartItem(item);

        if (
          !newItem.productId ||
          !newItem.slug ||
          !newItem.name ||
          !newItem.image.url ||
          !newItem.size.label
        ) {
          return;
        }

        if (
          newItem.size.isCustom &&
          (!isMeasurementType(newItem.size.measurementType) ||
            Object.keys(newItem.size.measurements ?? {}).length === 0)
        ) {
          return;
        }

        const newItemKey = getCartItemKey(newItem);

        set((state) => {
          const existingItem = state.cartItems.find(
            (cartItem) => getCartItemKey(cartItem) === newItemKey,
          );

          if (existingItem) {
            return {
              cartItems: state.cartItems.map((cartItem) =>
                getCartItemKey(cartItem) === newItemKey
                  ? {
                      ...newItem,
                      quantity: Math.min(
                        existingItem.quantity + newItem.quantity,
                        newItem.countInStock,
                      ),
                    }
                  : cartItem,
              ),
            };
          }

          return {
            cartItems: [
              ...state.cartItems,
              {
                ...newItem,
                quantity: Math.min(newItem.quantity, newItem.countInStock),
              },
            ],
          };
        });
      },

      removeItem: (item) => {
        const itemKey = getCartItemKey(item);

        set((state) => ({
          cartItems: state.cartItems.filter(
            (cartItem) => getCartItemKey(cartItem) !== itemKey,
          ),
        }));
      },

      updateItemQuantity: (item, quantity) => {
        const itemKey = getCartItemKey(item);
        const requestedQuantity = Math.floor(Number(quantity) || 0);

        set((state) => ({
          cartItems: state.cartItems.map((cartItem) => {
            if (getCartItemKey(cartItem) !== itemKey) {
              return cartItem;
            }

            return {
              ...cartItem,
              quantity: Math.max(
                1,
                Math.min(requestedQuantity, cartItem.countInStock),
              ),
            };
          }),
        }));
      },

      clearItems: () => {
        set({ cartItems: [] });
      },

      resetCart: () => {
        set({
          cartItems: [],
          shippingAddress: {},
          shippingRate: null,
          paymentMethod: "",
        });
      },

      saveShippingAddress: (address) => {
        set((state) => ({
          shippingAddress: {
            ...state.shippingAddress,
            ...address,
          },
        }));
      },

      saveShippingRate: (shippingRate) => {
        set({
          shippingRate: sanitizeShippingRate(shippingRate),
        });
      },

      savePaymentMethod: (paymentMethod) => {
        set({ paymentMethod });
      },
    }),
    {
      name: "store-cart-v4",
      storage: createJSONStorage(() => localStorage),

      version: 4,

      migrate: (persistedState) => {
        const state =
          typeof persistedState === "object" && persistedState !== null
            ? (persistedState as Partial<CartStore>)
            : {};

        return {
          cartItems: sanitizePersistedCartItems(state.cartItems),
          shippingAddress: state.shippingAddress ?? {},
          shippingRate: sanitizeShippingRate(state.shippingRate),
          paymentMethod: state.paymentMethod ?? "",
        };
      },

      partialize: (state) => ({
        cartItems: state.cartItems,
        shippingAddress: state.shippingAddress,
        shippingRate: state.shippingRate,
        paymentMethod: state.paymentMethod,
      }),
    },
  ),
);
