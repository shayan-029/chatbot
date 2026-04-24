import mongoose from "mongoose";
import { setServers } from "dns";

// Force Google DNS — fixes querySrv ECONNREFUSED on Windows
setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const DB_NAME = "frog_ai";

const cached = global as typeof global & {
  _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!cached._mongoose) {
  cached._mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // Always build the URI with the explicit database name to prevent
  // Mongoose from falling back to "local" or "test"
  const base = process.env.MONGODB_URI;
  if (!base) throw new Error("MONGODB_URI is not defined in .env.local");
  if (base.includes("<db_password>"))
    throw new Error("MONGODB_URI contains placeholder <db_password> — replace it in .env.local");

  // Strip any existing db path from the URI and inject DB_NAME explicitly
  const URI = base.replace(
    /(mongodb(?:\+srv)?:\/\/[^/]+\/)[^?]*/,
    `$1${DB_NAME}`
  );

  if (cached._mongoose!.conn) return cached._mongoose!.conn;

  if (!cached._mongoose!.promise) {
    console.log(`[MongoDB] Connecting to database: ${DB_NAME}`);
    cached._mongoose!.promise = mongoose
      .connect(URI, {
        dbName: DB_NAME,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        family: 4,
      })
      .then((m) => {
        console.log(`[MongoDB] Connected — db: ${m.connection.db?.databaseName}`);
        return m;
      })
      .catch((err) => {
        console.error("[MongoDB] Connection failed:", err.message);
        cached._mongoose!.promise = null;
        cached._mongoose!.conn = null;
        throw err;
      });
  }

  cached._mongoose!.conn = await cached._mongoose!.promise;
  return cached._mongoose!.conn;
}
