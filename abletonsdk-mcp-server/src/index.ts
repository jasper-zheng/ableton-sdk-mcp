#!/usr/bin/env node
/**
 * abletonsdk-mcp-server — bridges a Claude harness (Claude Code/Desktop) to the
 * in-Live Ableton kernel over MCP (stdio). Thin, stateless proxy: each tool call
 * → one kernel WebSocket request. The kernel owns resolution/serialization/exec.
 *
 * stdio rule: NEVER write to stdout (it is the MCP channel). Log via console.error.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { kernel, type KernelResponse } from "./kernel-client.js";
import { CHARACTER_LIMIT, KERNEL_URL } from "./constants.js";
import { runCodeShape, getContextShape, addrShape, renderAudioShape } from "./schemas.js";

const RESOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "resources");

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function toToolResult(resp: KernelResponse): ToolResult {
  const logs = resp.logs?.length ? `\n\n--- logs ---\n${resp.logs.join("\n")}` : "";
  if (!resp.ok) {
    const phase = resp.phase ? ` [${resp.phase}]` : "";
    return {
      content: [{ type: "text", text: `Error${phase}: ${resp.error ?? "unknown kernel error"}${logs}` }],
      isError: true,
    };
  }
  let text = JSON.stringify(resp.result ?? null, null, 2);
  let note = "";
  if (text.length > CHARACTER_LIMIT) {
    text = text.slice(0, CHARACTER_LIMIT);
    note = `\n\n[truncated to ${CHARACTER_LIMIT} chars — narrow the query (e.g. includeDevices:false) or use ableton_get_track / ableton_run_code to filter]`;
  }
  const out: ToolResult = { content: [{ type: "text", text: text + logs + note }] };
  if (isPlainObject(resp.result)) out.structuredContent = resp.result;
  return out;
}

async function proxy(method: string, params?: unknown): Promise<ToolResult> {
  try {
    return toToolResult(await kernel.call(method, params));
  } catch (e) {
    return { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true };
  }
}

const INSTRUCTIONS = `Drive Ableton Live via the in-Live kernel.

Workflow:
1. Perceive: call ableton_get_context for a project overview (tracks, clips, devices, mixer, scenes) — every object carries a stable "addr".
2. Learn the API: read resource ableton://api/sdk (the Extensions SDK types) and ableton://guide/run_code for patterns and hard limits.
3. Act: call ableton_run_code with JS/TS against the SDK (bindings: context, ableton, log, withinTransaction, sleep, signal, ui). Use convenience tools (ableton_get_track/device/clip_notes) for detail.
4. Re-query ableton_get_context after structural edits — handles are ephemeral and indices can shift.

Safety/UX: before destructive or large edits, perceive first, confirm in-Live with \`ui.confirm({title,summary,items,danger})\`, group the batch in one \`withinTransaction(() => Promise.all([...]))\` (one Cmd-Z), and report what changed. Wrap long work in \`ui.progress(text, cb)\`. (Dialogs pause the run_code timeout.)

Hard limits: no transport/playback control, no on-demand selection query (use the in-Live "Send to Agent" menu + ableton_get_selection), built-in Live devices only (no VST/preset loading), clip timing/loop set only at creation, no programmatic automation (set current values only).`;

const RUN_CODE_GUIDE = `# Writing ableton_run_code

Your code runs in the kernel (Node) against the **live** Ableton Extensions SDK.

## In scope (no imports!)
- \`context\` — the ExtensionContext. Start at \`context.application.song\`.
- \`ableton\` — the SDK namespace (classes for \`instanceof\`, enums like \`ableton.WarpMode\`).
- \`log(...)\` / \`console\` — captured and returned in \`logs\`.
- \`withinTransaction(fn)\` — group **independent** mutations into one undo step (synchronous; return \`Promise.all([...])\` for async grouping).
- \`ui.confirm({title,summary,items,danger})\` → boolean, and \`ui.progress(text, async (update, signal) => …)\` — in-Live confirm/progress dialogs (they pause the timeout). Use \`ui.confirm\` before destructive/large edits.
- \`sleep(ms)\`, \`signal\` (AbortSignal).
- Use \`return\` to send a JSON-serializable value back.

## Address scheme
Objects are referenced by stable addresses, e.g. \`{kind:"track",index:0}\`, \`{kind:"clipSlot",track:0,slot:1}\`, \`{kind:"device",track:0,index:2}\`. Get them from ableton_get_context. Don't cache handles across calls — re-resolve each run.

## Examples
\`\`\`ts
// read tempo
return context.application.song.tempo;
\`\`\`
\`\`\`ts
// create a 1-bar MIDI clip with a C-major triad
const song = context.application.song;
const track = await song.createMidiTrack();
track.name = "Agent";
const clip = await track.clipSlots[0].createMidiClip(4);
clip.notes = [
  {pitch:60,startTime:0,duration:1,velocity:100},
  {pitch:64,startTime:1,duration:1,velocity:100},
  {pitch:67,startTime:2,duration:1,velocity:100},
];
return {created: clip.name, notes: clip.notes.length};
\`\`\`

## Hard limits
- Handles are ephemeral (deletion/move/session change invalidates them) — re-query after structural edits.
- Transactions are synchronous (can't \`await\` inside) and there is no programmatic undo — rely on Live's native undo.
- A **synchronous** infinite loop will hang the host (only awaited work is bounded by timeoutMs).
- Built-in Live devices only via \`track.insertDevice("Reverb", 0)\` — no VST/AU or preset loading.
- No transport/playback state; no master/post-FX audio (render is pre-FX, per audio track).
`;

const server = new McpServer(
  { name: "abletonsdk-mcp-server", version: "1.0.0" },
  { instructions: INSTRUCTIONS },
);

// ---- tools ----
server.registerTool(
  "ableton_run_code",
  {
    title: "Run code in Ableton Live",
    description:
      "Execute JavaScript/TypeScript against the live Ableton SDK in the kernel and return its value + logs. The primary way to act on Live (create/modify tracks, clips, MIDI notes, devices, parameters). Read resource ableton://api/sdk for the API and ableton://guide/run_code for bindings, the address scheme, examples and limits.",
    inputSchema: runCodeShape,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  },
  async (args) => proxy("run_code", args),
);

server.registerTool(
  "ableton_get_context",
  {
    title: "Get Live Set overview",
    description:
      "Bounded snapshot of the current Live Set: song meta (tempo, scale, grid), tracks (name, type, mute/solo/arm, mixer values, clip-slot occupancy + clip summaries, device metadata), scenes, cue points, return/main tracks. Every object carries a stable 'addr' usable with other tools and run_code. Excludes MIDI notes and per-parameter values (use ableton_get_clip_notes / ableton_get_device).",
    inputSchema: getContextShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (args) => proxy("get_context", args),
);

server.registerTool(
  "ableton_get_track",
  {
    title: "Get full track detail",
    description:
      "Deep detail for one track: full session/arrangement/take-lane clips and the full device tree (incl. nested rack chains with parameter values). Takes a track address from ableton_get_context.",
    inputSchema: addrShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (args) => proxy("get_track", args),
);

server.registerTool(
  "ableton_get_device",
  {
    title: "Get device parameters",
    description:
      "Full parameter list (with current values, ranges, and value-item labels for quantized params) for a device, recursing rack chains. Takes a device address {kind:'device',track,index,chain?}.",
    inputSchema: addrShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (args) => proxy("get_device", args),
);

server.registerTool(
  "ableton_get_clip_notes",
  {
    title: "Get clip notes / warp",
    description:
      "For a MIDI clip: the full note list (pitch, startTime, duration, velocity, …). For an audio clip: warp settings and markers. Takes a clipSlot/arrangementClip address.",
    inputSchema: addrShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (args) => proxy("get_clip_notes", args),
);

server.registerTool(
  "ableton_get_selection",
  {
    title: "Get captured selection",
    description:
      "Returns the user's last in-Live selection captured via the 'Send to Agent' context-menu action (addresses + optional time range). Returns {selection:null} if nothing was sent. This is the only way to know what the user has selected (the SDK has no on-demand selection query).",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async () => proxy("get_selection", {}),
);

server.registerTool(
  "ableton_render_audio",
  {
    title: "Render track audio (pre-FX)",
    description:
      "Render the pre-effects audio of an audio track between two beat positions to a WAV file and return its path. Does not modify the Set. (Analysis of the WAV is up to the caller; deferred feature.)",
    inputSchema: renderAudioShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (args) => proxy("render_audio", args),
);

// ---- resources ----
server.registerResource(
  "ableton-sdk-api",
  "ableton://api/sdk",
  {
    title: "Ableton Extensions SDK API (TypeScript types)",
    description: "The full .d.ts type surface of @ableton-extensions/sdk. Read this to write correct ableton_run_code.",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/plain", text: readFileSync(join(RESOURCES_DIR, "sdk.d.ts"), "utf8") }],
  }),
);

server.registerResource(
  "ableton-run-code-guide",
  "ableton://guide/run_code",
  {
    title: "How to write ableton_run_code",
    description: "Bindings in scope, the address scheme, worked examples, and the hard SDK limits.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/markdown", text: RUN_CODE_GUIDE }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[abletonsdk-mcp-server] running on stdio; kernel = ${KERNEL_URL}`);
}

main().catch((e) => {
  console.error("[abletonsdk-mcp-server] fatal:", e);
  process.exit(1);
});
