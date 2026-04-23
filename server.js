// Custom Next.js server with Socket.io for real-time Groq streaming

// Load .env.local before anything else (Next.js does this in app.prepare() but
// we need the API key available the moment a socket message arrives)
try {
  const { loadEnvConfig } = require("@next/env");
  loadEnvConfig(process.cwd());
} catch {
  // @next/env unavailable — env will be loaded during app.prepare()
}

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    let abortController = null;

    socket.on("chat:send", async ({ messages, systemPrompt }) => {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        socket.emit("chat:error", { message: "GROQ_API_KEY is not configured on the server." });
        return;
      }

      abortController = new AbortController();

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            stream: true,
            temperature: 0.7,
            max_tokens: 2048,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          socket.emit("chat:error", { message: `Groq API error ${res.status}: ${errText}` });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              socket.emit("chat:done");
              return;
            }
            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) socket.emit("chat:delta", { content: delta });
            } catch {
              // skip malformed chunk
            }
          }
        }

        socket.emit("chat:done");
      } catch (err) {
        if (err.name === "AbortError") return;
        socket.emit("chat:error", { message: err.message || "Unknown error" });
      } finally {
        abortController = null;
      }
    });

    socket.on("chat:stop", () => {
      abortController?.abort();
      abortController = null;
    });

    socket.on("disconnect", () => {
      abortController?.abort();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
