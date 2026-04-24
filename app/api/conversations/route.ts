import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Conversation from "@/app/models/Conversation";

export const dynamic = "force-dynamic";

// GET — list all conversations newest first
export async function GET() {
  try {
    await connectDB();
    const docs = await Conversation.find().sort({ updatedAt: -1 });
    return NextResponse.json(docs.map((d) => d.toJSON()));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/conversations]", msg);
    return NextResponse.json({ error: "Failed to fetch conversations.", detail: msg }, { status: 500 });
  }
}

// POST — create a new conversation
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const doc = await Conversation.create({
      title:        body.title        ?? "New Chat",
      messages:     body.messages     ?? [],
      systemPrompt: body.systemPrompt ?? "",
    });
    return NextResponse.json(doc.toJSON(), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/conversations]", msg);
    return NextResponse.json({ error: "Failed to create conversation.", detail: msg }, { status: 500 });
  }
}
