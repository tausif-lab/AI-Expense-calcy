import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local");
}

// Prevent multiple connections in Next.js dev (hot reload)
declare global {
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = null;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached;

  cached = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  global._mongooseConn = cached;
  return cached;
}