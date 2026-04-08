import express, { Request, Response } from "express";

// ─── SSE Client Registry ────────────────────────────────────────────────────

const clients = new Set<Response>();

// ─── Router ─────────────────────────────────────────────────────────────────

export const tracerRouter = express.Router();

/**
 * GET /trace/stream
 * Opens a Server-Sent Events stream.  Every `emit()` call will push a JSON
 * event to all connected clients.
 */
tracerRouter.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat comment every 25 s to keep the connection alive
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  clients.add(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// ─── Emit Helper ─────────────────────────────────────────────────────────────

/**
 * Broadcast a trace event to all connected SSE clients.
 *
 * @param type  - Event type, e.g. "tool_call" | "agent_step" | "error"
 * @param data  - Arbitrary payload to serialise as JSON
 */
export function emit(type: string, data: Record<string, unknown>): void {
  const payload = JSON.stringify({ type, ...data, ts: Date.now() });
  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }
}
