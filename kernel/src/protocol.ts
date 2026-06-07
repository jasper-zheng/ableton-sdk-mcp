import type * as ableton from "@ableton-extensions/sdk";

/** The initialized SDK context for our pinned API version. */
export type Ctx = ableton.ExtensionContext<"1.0.0">;

/** A JSON-RPC-ish request from the external harness. */
export type Request = { id: number; method: string; params?: unknown };

/** The reply sent back over the socket. */
export type Response = {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  /** For run_code failures: "transpile" | "runtime" | "timeout". */
  phase?: string;
  logs?: string[];
};

/**
 * Every method handler returns a uniform shape: a `result` payload plus
 * optional `logs`. Handlers may also report a soft failure (with `error`/`phase`)
 * while still returning `logs` — used by `run_code` so output survives errors.
 * Dispatch maps `error` → `ok: false`. Thrown errors are caught by dispatch too.
 */
export type HandlerResult = {
  result?: unknown;
  logs?: string[];
  error?: string;
  phase?: string;
};

export type Handler = (
  ctx: Ctx,
  params: Record<string, unknown>,
) => Promise<HandlerResult> | HandlerResult;

/** Handles carry bigint ids; make every payload JSON-safe. */
export function jsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
