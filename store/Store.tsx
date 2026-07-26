"use client";

import {
  createContext,
  useReducer,
  ReactNode,
  Dispatch,
  useContext,
} from "react";
import Cookies from "js-cookie";

interface CartItem {
  slug: string;
  name: string;
  quantity: number;
  image: string;
  price: number;
  countInStock: number;
  selectedColor?: string;
  selectedSize?: string;
  customMeasurements?: Record<string, string> | null;
}

interface ShippingAddress {
  fullName?: string;
  address?: string;
  city?: string;
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
}

interface CartState {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

interface State {
  cart: CartState;
}

type Action =
  | { type: "CART_ADD_ITEM"; payload: CartItem }
  | { type: "CART_REMOVE_ITEM"; payload: CartItem }
  | { type: "CART_RESET" }
  | { type: "CART_CLEAR_ITEMS" }
  | { type: "SAVE_SHIPPING_ADDRESS"; payload: ShippingAddress }
  | { type: "SAVE_PAYMENT_METHOD"; payload: string };

interface StoreContextValue {
  state: State;
  dispatch: Dispatch<Action>;
}

export const Store = createContext<StoreContextValue>({
  state: {
    cart: {
      cartItems: [],
      shippingAddress: {},
      paymentMethod: "",
    },
  },
  dispatch: () => undefined,
});

const cartCookie = Cookies.get("cart");

const initialState: State = {
  cart: cartCookie
    ? (JSON.parse(cartCookie) as CartState)
    : { cartItems: [], shippingAddress: {}, paymentMethod: "" },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CART_ADD_ITEM": {
      const newItem = action.payload;
      const existItem = state.cart.cartItems.find(
        (item) => item.slug === newItem.slug,
      );

      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            item.slug === existItem.slug ? newItem : item,
          )
        : [...state.cart.cartItems, newItem];

      Cookies.set("cart", JSON.stringify({ ...state.cart, cartItems }));
      return { ...state, cart: { ...state.cart, cartItems } };
    }

    case "CART_REMOVE_ITEM": {
      const cartItems = state.cart.cartItems.filter(
        (item) => item.slug !== action.payload.slug,
      );
      Cookies.set("cart", JSON.stringify({ ...state.cart, cartItems }));
      return { ...state, cart: { ...state.cart, cartItems } };
    }

    case "CART_RESET":
      Cookies.remove("cart");
      return {
        ...state,
        cart: {
          cartItems: [],
          shippingAddress: { location: {} },
          paymentMethod: "",
        },
      };

    case "CART_CLEAR_ITEMS": {
      const cart = { ...state.cart, cartItems: [] };
      Cookies.set("cart", JSON.stringify(cart));
      return { ...state, cart };
    }

    case "SAVE_SHIPPING_ADDRESS": {
      const shippingAddress = {
        ...state.cart.shippingAddress,
        ...action.payload,
      };
      const cart = { ...state.cart, shippingAddress };
      Cookies.set("cart", JSON.stringify(cart));
      return { ...state, cart };
    }

    case "SAVE_PAYMENT_METHOD": {
      const cart = { ...state.cart, paymentMethod: action.payload };
      Cookies.set("cart", JSON.stringify(cart));
      return { ...state, cart };
    }

    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value: StoreContextValue = { state, dispatch };

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export const useStore = () => {
  const context = useContext(Store);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
