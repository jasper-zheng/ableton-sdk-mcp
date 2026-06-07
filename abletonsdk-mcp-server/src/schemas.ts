import { z } from "zod";

const nonNegInt = z.number().int().nonnegative();

/**
 * Mirrors the kernel `Address` discriminated union (kernel/src/address.ts).
 * The kernel remains the validating authority; this is a discovery/UX aid.
 */
export const AddressSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("track"), index: nonNegInt, name: z.string().optional() }),
  z.object({ kind: z.literal("returnTrack"), index: nonNegInt }),
  z.object({ kind: z.literal("mainTrack") }),
  z.object({ kind: z.literal("clipSlot"), track: nonNegInt, slot: nonNegInt }),
  z.object({ kind: z.literal("arrangementClip"), track: nonNegInt, index: nonNegInt }),
  z.object({ kind: z.literal("scene"), index: nonNegInt }),
  z.object({ kind: z.literal("cuePoint"), index: nonNegInt }),
  z.object({ kind: z.literal("device"), track: nonNegInt, index: nonNegInt, chain: z.array(z.number().int()).optional() }),
  z.object({ kind: z.literal("param"), track: nonNegInt, device: nonNegInt, index: nonNegInt, chain: z.array(z.number().int()).optional() }),
  z.object({
    kind: z.literal("mixerParam"),
    trackKind: z.enum(["track", "return", "main"]),
    trackIndex: z.number().int().optional(),
    which: z.enum(["volume", "panning", "send"]),
    sendIndex: z.number().int().optional(),
  }),
]).describe("Stable positional reference to a Live object. Get valid addresses from ableton_get_context.");

// ---- tool input shapes (ZodRawShape — passed to registerTool.inputSchema) ----

export const runCodeShape = {
  code: z
    .string()
    .describe(
      "JavaScript/TypeScript to run in the kernel against the live Ableton SDK. In scope: `context` (ExtensionContext), `ableton` (SDK namespace), `log()`, `console`, `withinTransaction(fn)`, `sleep(ms)`, `signal`. Use `return` to send a value back. NO import statements. See resource ableton://api/sdk for the API and ableton://guide/run_code for patterns/limits.",
    ),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .max(120000)
    .optional()
    .describe("Wall-clock timeout for awaited work (default 30000). Note: synchronous infinite loops are NOT interruptible."),
};

export const getContextShape = {
  includeReturns: z.boolean().optional().describe("Include return tracks (default true)."),
  includeMain: z.boolean().optional().describe("Include the main track (default true)."),
  includeDevices: z.boolean().optional().describe("Include per-track device metadata (default true). Set false to shrink large Sets."),
};

export const addrShape = { addr: AddressSchema };

export const renderAudioShape = {
  addr: AddressSchema.describe("An audio track address ({kind:'track', index}) whose pre-FX audio to render."),
  startBeat: z.number().describe("Start position in beats."),
  endBeat: z.number().describe("End position in beats."),
};
