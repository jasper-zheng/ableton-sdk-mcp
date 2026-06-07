import * as ableton from "@ableton-extensions/sdk";
import { transform } from "sucrase";
import { type Ctx, type HandlerResult, jsonReplacer } from "./protocol.js";
import { confirmDialog, progressDialog, type ConfirmOptions } from "./ui-dialogs.js";

const DEFAULT_TIMEOUT_MS = 30000;

/** Internal marker so the timeout branch of the race is recognisable. */
class TimeoutError extends Error {}

/** Run an async UI interaction with the wall-clock timeout paused (user think-time
 * must not trip the run_code timeout). */
async function withPausedTimeout<T>(
  gate: { pause: () => void; resume: () => void },
  fn: () => Promise<T>,
): Promise<T> {
  gate.pause();
  try {
    return await fn();
  } finally {
    gate.resume();
  }
}

/**
 * Globals shadowed (bound to `undefined`) inside the executor to curate scope.
 * NOTE: `node:vm` is a no-op in the Ableton Extension Host's embedded Node, so we
 * execute via `new Function` and curate by shadowing rather than via a vm context.
 * (`eval`/`arguments` can't be used as parameter names in strict mode.)
 */
const SHADOWED = [
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "globalThis",
  "global",
  "Buffer",
];

/**
 * Hardened executor for agent-authored code.
 *
 * Containment, not isolation: the code runs in the host process with the live
 * SDK `context`. We transpile TS, curate the scope (shadowed globals; no
 * require/process/fs), bound awaited work by wall-clock time, and report phased
 * errors. LIMITATION: a *synchronous* infinite loop cannot be interrupted (it
 * blocks the event loop so the timeout timer can't fire) — only awaited work is
 * bounded. Acceptable because the author is Claude (semi-trusted).
 */
export async function runCode(
  ctx: Ctx,
  code: string,
  opts: { timeoutMs?: number } = {},
): Promise<HandlerResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logs: string[] = [];
  const log = (...args: unknown[]) =>
    logs.push(
      args.map((a) => (typeof a === "string" ? a : JSON.stringify(a, jsonReplacer))).join(" "),
    );
  const consoleShim = { log, error: log, warn: log, info: log, debug: log };

  // 1. Wrap first (so a top-level `return` is valid), then strip TS types.
  //    `disableESTransforms` keeps modern ES syntax (??, ?., ??=, class fields,
  //    numeric separators) as-is for the host's native Node (>=24) instead of
  //    down-levelling it. Without this, sucrase rewrites `??`/`?.` into helper
  //    calls (`_nullishCoalesce`/`_optionalChain`) and prepends the helper decls;
  //    embedded after our `return ${transpiled}` those decls fall out of scope →
  //    `ReferenceError: _nullishCoalesce is not defined` at runtime.
  let transpiled: string;
  try {
    transpiled = transform(`(async () => {\n${code}\n})()`, {
      transforms: ["typescript"],
      disableESTransforms: true,
    }).code;
  } catch (e) {
    return { error: `[transpile] ${e instanceof Error ? e.message : String(e)}`, phase: "transpile", logs };
  }

  // 2. Build the executor with curated bindings + shadowed globals.
  const ac = new AbortController();

  // Pausable wall-clock timeout state (the timer is armed in step 3). UI dialogs
  // pause it via `gate` so the time the user spends in a confirm/progress dialog
  // doesn't count against the timeout.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let remaining = timeoutMs;
  let startedAt = 0;
  let fireTimeout: (e: TimeoutError) => void = () => {};
  const arm = () => {
    startedAt = Date.now();
    timer = setTimeout(() => {
      ac.abort();
      fireTimeout(new TimeoutError());
    }, Math.max(0, remaining));
  };
  const gate = {
    pause: () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
        remaining -= Date.now() - startedAt;
      }
    },
    resume: () => {
      if (timer === undefined) arm();
    },
  };

  // In-Live UI helpers (WP6 safety/UX): confirm dialogs + progress dialogs, each
  // pausing the timeout while open. The agent uses these to confirm destructive/
  // large actions and to show progress for long work.
  const ui = {
    confirm: (opts: ConfirmOptions | string) =>
      withPausedTimeout(gate, () =>
        confirmDialog(ctx, typeof opts === "string" ? { summary: opts } : opts),
      ),
    progress: (
      text: string,
      cb: (update: (t: string, p?: number) => Promise<void>, signal: AbortSignal) => Promise<unknown>,
    ) => withPausedTimeout(gate, () => progressDialog(ctx, text, cb)),
  };

  const bindings: Record<string, unknown> = {
    context: ctx,
    ableton,
    log,
    console: consoleShim,
    withinTransaction: <T>(fn: () => T): T => ctx.withinTransaction(fn),
    sleep: (ms: number) => new Promise((r) => setTimeout(r, ms)),
    signal: ac.signal,
    ui,
  };
  const names = [...Object.keys(bindings), ...SHADOWED];
  const values = [...Object.values(bindings), ...SHADOWED.map(() => undefined)];

  let codePromise: Promise<unknown>;
  try {
    const fn = new Function(...names, `"use strict";\nreturn ${transpiled};`) as (
      ...args: unknown[]
    ) => unknown;
    codePromise = Promise.resolve(fn(...values));
  } catch (e) {
    // new Function syntax error, or a synchronous throw before the first await.
    return {
      error: `[runtime] ${e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e)}`,
      phase: "runtime",
      logs,
    };
  }

  // 3. Bound awaited work by wall-clock time (+ cooperative AbortSignal). The timer
  //    is armed here; `ui` dialogs pause/resume it (see gate) so user think-time is
  //    excluded. (A *synchronous* infinite loop still can't be interrupted.)
  const timeoutPromise = new Promise<never>((_, reject) => {
    fireTimeout = reject;
  });
  arm();

  try {
    const result = await Promise.race([codePromise, timeoutPromise]);
    return { result, logs };
  } catch (e) {
    if (e instanceof TimeoutError) {
      return {
        error: `[timeout] execution exceeded ${timeoutMs}ms (awaited work may still be running)`,
        phase: "timeout",
        logs,
      };
    }
    const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    return { error: `[runtime] ${msg}`, phase: "runtime", logs };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
