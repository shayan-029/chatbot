import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Turtle.ai API",
    version: "1.0.0",
    description: "API for Turtle.ai chatbot — powered by Groq & MongoDB",
  },
  servers: [{ url: "/api", description: "Next.js API Routes" }],
  tags: [
    { name: "Chat",          description: "AI chat with Groq streaming" },
    { name: "Conversations", description: "CRUD for chat history in MongoDB" },
    { name: "System",        description: "Health & status" },
  ],
  paths: {
    "/chat": {
      post: {
        tags: ["Chat"],
        summary: "Send a message and get an AI response",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role:    { type: "string", enum: ["user", "assistant", "system"] },
                        content: { type: "string" },
                      },
                    },
                    example: [{ role: "user", content: "Hello!" }],
                  },
                  systemPrompt: { type: "string", example: "You are a helpful assistant." },
                  stream:       { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Streaming SSE response (or JSON if stream:false)" },
          400: { description: "Invalid request body" },
          429: { description: "Rate limit reached — auto-retried once" },
          500: { description: "GROQ_API_KEY not configured" },
          502: { description: "Failed to reach Groq API" },
        },
      },
    },

    "/conversations": {
      get: {
        tags: ["Conversations"],
        summary: "Get all conversations (newest first)",
        responses: {
          200: {
            description: "Array of conversations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Conversation" },
                },
              },
            },
          },
          500: { description: "MongoDB error" },
        },
      },
      post: {
        tags: ["Conversations"],
        summary: "Create a new conversation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title:        { type: "string", example: "New Chat" },
                  messages:     { type: "array", items: { $ref: "#/components/schemas/Message" }, default: [] },
                  systemPrompt: { type: "string", example: "You are a helpful assistant." },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created conversation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Conversation" },
              },
            },
          },
          500: { description: "MongoDB error" },
        },
      },
    },

    "/conversations/{id}": {
      put: {
        tags: ["Conversations"],
        summary: "Update a conversation (messages, title, systemPrompt)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "MongoDB _id" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title:        { type: "string" },
                  messages:     { type: "array", items: { $ref: "#/components/schemas/Message" } },
                  systemPrompt: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated conversation",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Conversation" } } },
          },
          404: { description: "Conversation not found" },
          500: { description: "MongoDB error" },
        },
      },
      delete: {
        tags: ["Conversations"],
        summary: "Delete a conversation",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "{ success: true }" },
          500: { description: "MongoDB error" },
        },
      },
    },

    "/health": {
      get: {
        tags: ["System"],
        summary: "Check Groq API key and MongoDB connection status",
        responses: {
          200: {
            description: "Health status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    configured:     { type: "boolean" },
                    groqConfigured: { type: "boolean" },
                    mongoConfigured: { type: "boolean" },
                    mongoConnected:  { type: "boolean" },
                  },
                  example: {
                    configured: true, groqConfigured: true,
                    mongoConfigured: true, mongoConnected: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      Message: {
        type: "object",
        properties: {
          id:        { type: "string", example: "1720000000000-abc123" },
          role:      { type: "string", enum: ["user", "assistant", "system"] },
          content:   { type: "string", example: "Hello!" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      Conversation: {
        type: "object",
        properties: {
          id:           { type: "string", example: "6688f1a2b3c4d5e6f7890123" },
          title:        { type: "string", example: "New Chat" },
          messages:     { type: "array", items: { $ref: "#/components/schemas/Message" } },
          systemPrompt: { type: "string" },
          createdAt:    { type: "string", format: "date-time" },
          updatedAt:    { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
