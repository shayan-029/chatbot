import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Conversation from "@/app/models/Conversation";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// PUT — update title, messages, or systemPrompt
export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!mongoose.Types.ObjectId.isValid(params.id))
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const doc = await Conversation.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(doc.toJSON());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUT /api/conversations/:id]", msg);
    return NextResponse.json({ error: "Failed to update conversation.", detail: msg }, { status: 500 });
  }
}

// DELETE — remove a conversation
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!mongoose.Types.ObjectId.isValid(params.id))
    return NextResponse.json({ success: true }); // local-only ID, nothing to delete in DB

  try {
    await connectDB();
    await Conversation.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/conversations/:id]", msg);
    return NextResponse.json({ error: "Failed to delete conversation.", detail: msg }, { status: 500 });
  }
}
