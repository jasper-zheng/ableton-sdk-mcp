import WebSocket from "ws";
import { KERNEL_URL, CALL_TIMEOUT_MS } from "./constants.js";

export interface KernelResponse {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  phase?: string;
  logs?: string[];
}

function offlineMessage(detail: string): string {
  return (
    `Ableton kernel not reachable at ${KERNEL_URL}. ` +
    `Open Live 12 Beta (Preferences → Extensions → Developer Mode) and run: ` +
    `cd kernel && npm start -- --live "/Applications/Ableton Live 12 Beta.app". (${detail})`
  );
}

interface Pending {
  resolve: (r: KernelResponse) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Thin, reconnecting WS client to the in-Live kernel. */
class KernelClient {
  private ws?: WebSocket;
  private connecting?: Promise<WebSocket>;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();

  private connect(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve(this.ws);
    if (this.connecting) return this.connecting;

    this.connecting = new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(KERNEL_URL);
      const onConnectError = (e: Error) => {
        this.connecting = undefined;
        reject(new Error(offlineMessage(e.message)));
      };
      ws.once("error", onConnectError);
      ws.once("open", () => {
        ws.off("error", onConnectError);
        this.ws = ws;
        this.connecting = undefined;
        ws.on("message", (data) => this.onMessage(data.toString()));
        ws.on("error", () => { /* handled by close */ });
        ws.on("close", () => {
          this.ws = undefined;
          this.failAll(new Error("Kernel connection closed."));
        });
        resolve(ws);
      });
    });
    return this.connecting;
  }

  private onMessage(text: string): void {
    let msg: KernelResponse;
    try {
      msg = JSON.parse(text) as KernelResponse;
    } catch {
      return;
    }
    const p = this.pending.get(msg.id);
    if (p) {
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      p.resolve(msg);
    }
  }

  private failAll(e: Error): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(e);
    }
    this.pending.clear();
  }

  async call(method: string, params?: unknown): Promise<KernelResponse> {
    const ws = await this.connect();
    const id = this.nextId++;
    return new Promise<KernelResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Kernel call '${method}' timed out after ${CALL_TIMEOUT_MS}ms.`));
      }, CALL_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params: params ?? {} }));
    });
  }
}

export const kernel = new KernelClient();
