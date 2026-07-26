import { Types } from "mongoose";


export type ProductType = {
  
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  sizes: {
    size: string;
    price: number;
  }[];
  colors: {
    name: string;
    hex: string;
  }[];
  images: {
    url: string;
    public_id: string;
  }[];
  views: number;
  sales: number;
  numReviews: number;
  countInStock: number; 
  addedBy: Types.ObjectId; 
  createdAt: string;
  updatedAt: string;
};


export type ProductsType = ProductType[];

export type CartItemType = ProductType & {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
};

export type CartItemsType = CartItemType[];

export type ShippingFormInputs = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type PaymentFormInputs = {
  cardHolder: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
};

export type CartStoreStateType = {
  cart: CartItemsType;
  hasHydrated: boolean;
};

export type CartStoreActionsType = {
  addToCart: (product: CartItemType) => void;
  removeFromCart: (product: CartItemType) => void;
  clearCart: () => void;
};





export type MediaType = {
  image_url: string;
  public_id: string;
};

export interface UserType {
  // Core Better Auth Fields
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  // Custom App Fields 
  role: "user" | "staff" | "admin"; 
  avatar?: MediaType;
  // Security & Migration
  passwordless?: boolean;
  betterAuthId?: string; 
  lastLogin?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountType {
  userId: Types.ObjectId;        // Reference to User (ObjectId for Mongoose)
  accountId: string;             // Email (credentials) or Provider ID (social)
  providerId: string;            // "credential", "google", etc. 
  password?: string;             // Hashed passwords belong HERE, not in UserType
  // Token Management [6]
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;   // Corrected from generic 'expiresAt'
  refreshTokenExpiresAt?: Date;  // Corrected from generic 'expiresAt'
  scope?: string;
  passwordResetToken?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}


export interface SessionType {
  userId: Types.ObjectId;   // Reference to User
  token: string;            // Unique session token
  expiresAt: Date;          // Expiration timestamp
  ipAddress?: string;
  userAgent?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationType {
  identifier: string;   // Email address used for verification
  value: string;        // The token/OTP value
  expiresAt: Date;      // Expiration timestamp
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}