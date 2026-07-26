// utils/db.ts
import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null });

export async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 3000,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnect() {
  // NEVER disconnect in dev or server components
  if (process.env.NODE_ENV === "production") {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

const db = { connect, disconnect };
export default db;