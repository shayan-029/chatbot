import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    id:        { type: String, required: true },
    role:      { type: String, enum: ["user", "assistant", "system"], required: true },
    content:   { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    title:        { type: String, default: "New Chat" },
    messages:     { type: [MessageSchema], default: [] },
    systemPrompt: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
