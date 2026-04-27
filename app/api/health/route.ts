import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const mongoConfigured = Boolean(process.env.MONGODB_URI);

  let mongoConnected = false;
  if (mongoConfigured) {
    try {
      await connectDB();
      mongoConnected = true;
    } catch {
      // Do not expose connection error details publicly
    }
  }

  const configured = groqConfigured && mongoConnected;
  return NextResponse.json({ configured, groqConfigured, mongoConfigured, mongoConnected });
}
