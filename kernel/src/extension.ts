import * as ableton from "@ableton-extensions/sdk";
import { WebSocketServer, type WebSocket } from "ws";
import { type Request, type Response, jsonReplacer } from "./protocol.js";
import { handlers } from "./handlers.js";
import { registerSelectionMenus } from "./selection.js";

const HOST = "127.0.0.1";
const PORT = 17890;

async function dispatch(
  ctx: ableton.ExtensionContext<"1.0.0">,
  req: Request,
): Promise<Response> {
  const handler = handlers[req.method];
  if (!handler) return { id: req.id, ok: false, error: `Unknown method: ${req.method}` };
  try {
    const hr = await handler(ctx, (req.params as Record<string, unknown>) ?? {});
    // Handlers may report a soft failure (error/phase) while still returning logs.
    return { id: req.id, ok: !hr.error, result: hr.result, error: hr.error, phase: hr.phase, logs: hr.logs };
  } catch (e) {
    return {
      id: req.id,
      ok: false,
      error: e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e),
    };
  }
}

export function activate(activation: ableton.ActivationContext) {
  const context = ableton.initialize(activation, "1.0.0");

  registerSelectionMenus(context);

  // No teardown hook exists in the SDK lifecycle, so guard against a stale
  // server lingering on the port if `activate` runs twice in one host process.
  const g = globalThis as unknown as { __kernelWss?: WebSocketServer };
  if (g.__kernelWss) {
    try {
      g.__kernelWss.close();
    } catch {
      /* ignore */
    }
  }

  const wss = new WebSocketServer({ host: HOST, port: PORT });
  g.__kernelWss = wss;

  wss.on("listening", () => console.log(`[kernel] WS listening on ${HOST}:${PORT}`));

  wss.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[kernel] Port ${PORT} already in use — restart the Extension Host.`);
    } else {
      console.error("[kernel] WebSocket server error:", err);
    }
  });

  wss.on("connection", (socket: WebSocket) => {
    console.log("[kernel] client connected");
    socket.on("message", async (data) => {
      let req: Request;
      try {
        req = JSON.parse(data.toString()) as Request;
      } catch {
        socket.send(JSON.stringify({ id: -1, ok: false, error: "Invalid JSON" }));
        return;
      }
      const res = await dispatch(context, req);
      socket.send(JSON.stringify(res, jsonReplacer));
    });
    socket.on("close", () => console.log("[kernel] client disconnected"));
  });

  console.log("[kernel] ableton-agent-kernel activated (WP1 perception)");
}
