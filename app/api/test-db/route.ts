import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Conversation from "@/app/models/Conversation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const doc = await Conversation.create({
      title: "__test__",
      messages: [],
      systemPrompt: "",
    });

    return NextResponse.json({
      success: true,
      savedId: doc._id.toString(),
      message: "Document written to MongoDB successfully. Check Compass for frog_ai > conversations.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
