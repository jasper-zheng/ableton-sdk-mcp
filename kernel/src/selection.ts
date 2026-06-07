import * as ableton from "@ableton-extensions/sdk";
import type { Ctx } from "./protocol.js";
import { type Address, addressOf } from "./address.js";

export interface CapturedSelection {
  scope: string;
  capturedAt: number;
  addresses: Address[];
  timeSelection?: { start: number; end: number };
}

let lastSelection: CapturedSelection | null = null;

export function getSelection(): CapturedSelection | null {
  return lastSelection;
}

const COMMAND_ID = "agent.sendSelection";

const SCOPES: ableton.ContextMenuScope<"1.0.0">[] = [
  "AudioClip",
  "AudioTrack",
  "ClipSlot",
  "DrumRack",
  "MidiClip",
  "MidiTrack",
  "Sample",
  "Scene",
  "Simpler",
  "ClipSlotSelection",
  "AudioTrack.ArrangementSelection",
  "MidiTrack.ArrangementSelection",
];

function resolveAddr(ctx: Ctx, handle: ableton.Handle): Address | null {
  try {
    const obj = ctx.getObjectFromHandle(handle, ableton.DataModelObject);
    return addressOf(ctx, obj);
  } catch {
    return null;
  }
}

/**
 * Capture whatever the user right-clicked. The host passes a single Handle for
 * object scopes, an ArrangementSelection (selected_lanes + time range) or a
 * ClipSlotSelection (selected_clip_slots) for the selection scopes. All handle
 * resolution here is synchronous.
 */
function captureFromArg(ctx: Ctx, arg: unknown): void {
  const addresses: Address[] = [];
  let timeSelection: { start: number; end: number } | undefined;
  let scope = "object";

  const a = arg as {
    selected_lanes?: ableton.Handle[];
    time_selection_start?: number;
    time_selection_end?: number;
    selected_clip_slots?: ableton.Handle[];
  };

  if (a && Array.isArray(a.selected_lanes)) {
    scope = "arrangementSelection";
    timeSelection = { start: a.time_selection_start ?? 0, end: a.time_selection_end ?? 0 };
    for (const h of a.selected_lanes) {
      const addr = resolveAddr(ctx, h);
      if (addr) addresses.push(addr);
    }
  } else if (a && Array.isArray(a.selected_clip_slots)) {
    scope = "clipSlotSelection";
    for (const h of a.selected_clip_slots) {
      const addr = resolveAddr(ctx, h);
      if (addr) addresses.push(addr);
    }
  } else {
    const addr = resolveAddr(ctx, arg as ableton.Handle);
    if (addr) {
      addresses.push(addr);
      scope = addr.kind;
    }
  }

  lastSelection = { scope, capturedAt: Date.now(), addresses, timeSelection };
  console.log(`[kernel] selection captured (${scope}): ${JSON.stringify(addresses)}`);
}

/** Register the "Send to Agent" context-menu action across all useful scopes. */
export function registerSelectionMenus(ctx: Ctx): void {
  ctx.commands.registerCommand(COMMAND_ID, (arg: unknown) => captureFromArg(ctx, arg));
  for (const scope of SCOPES) {
    void ctx.ui
      .registerContextMenuAction(scope, "Send to Agent", COMMAND_ID)
      .catch((e: unknown) => console.error(`[kernel] failed to register menu for ${scope}:`, e));
  }
}
