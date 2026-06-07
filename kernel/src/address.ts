import * as ableton from "@ableton-extensions/sdk";
import type { Ctx } from "./protocol.js";

/**
 * A stable, positional reference to an object in the Live Set.
 *
 * Handles are ephemeral (invalidated by move/delete/session change), so the
 * agent never holds them across turns. Instead it works with these addresses,
 * which `resolveAddress` re-resolves against the *current* model on every call.
 * This same resolver is reused by the WP2 action layer.
 */
export type Address =
  | { kind: "track"; index: number; name?: string }
  | { kind: "returnTrack"; index: number }
  | { kind: "mainTrack" }
  | { kind: "clipSlot"; track: number; slot: number }
  | { kind: "arrangementClip"; track: number; index: number }
  | { kind: "scene"; index: number }
  | { kind: "cuePoint"; index: number }
  // `chain` descends into racks as alternating [chainIndex, deviceIndex, ...] pairs.
  | { kind: "device"; track: number; index: number; chain?: number[] }
  | { kind: "param"; track: number; device: number; index: number; chain?: number[] }
  | {
      kind: "mixerParam";
      trackKind: "track" | "return" | "main";
      trackIndex?: number;
      which: "volume" | "panning" | "send";
      sendIndex?: number;
    };

type DMO = ableton.DataModelObject<"1.0.0">;
type Track = ableton.Track<"1.0.0">;
type Device = ableton.Device<"1.0.0">;

function sameHandle(a: DMO, b: DMO): boolean {
  return a.handle.id === b.handle.id;
}

function trackByKind(
  ctx: Ctx,
  trackKind: "track" | "return" | "main",
  trackIndex?: number,
): Track {
  const song = ctx.application.song;
  if (trackKind === "main") return song.mainTrack;
  const list = trackKind === "return" ? song.returnTracks : song.tracks;
  const t = list[trackIndex ?? -1];
  if (!t) throw new Error(`No ${trackKind} track at index ${trackIndex}`);
  return t;
}

/** Descend track.devices[index] then through any rack `chain` path. */
function resolveDevice(ctx: Ctx, track: number, index: number, chain?: number[]): Device {
  const t = ctx.application.song.tracks[track];
  if (!t) throw new Error(`No track at index ${track}`);
  let dev: Device | undefined = t.devices[index];
  if (!dev) throw new Error(`No device at track ${track} index ${index}`);
  const path = chain ?? [];
  for (let i = 0; i + 1 < path.length; i += 2) {
    const rack = dev;
    if (!(rack instanceof ableton.RackDevice)) {
      throw new Error(`Device at chain step ${i} is not a rack; cannot descend`);
    }
    const ch: ableton.Chain<"1.0.0"> = rack.chains[path[i]!]!;
    if (!ch) throw new Error(`No chain ${path[i]} in rack`);
    const next: Device | undefined = ch.devices[path[i + 1]!];
    if (!next) throw new Error(`No device ${path[i + 1]} in chain ${path[i]}`);
    dev = next;
  }
  return dev;
}

/** Resolve an address into the live SDK object. Throws if it cannot be found. */
export function resolveAddress(ctx: Ctx, addr: Address): DMO {
  const song = ctx.application.song;
  switch (addr.kind) {
    case "track": {
      const t = song.tracks[addr.index];
      if (!t) throw new Error(`No track at index ${addr.index}`);
      if (addr.name !== undefined && t.name !== addr.name) {
        console.warn(
          `[kernel] address drift: track ${addr.index} is "${t.name}", expected "${addr.name}". Re-run get_context.`,
        );
      }
      return t;
    }
    case "returnTrack":
      return trackByKind(ctx, "return", addr.index);
    case "mainTrack":
      return song.mainTrack;
    case "clipSlot": {
      const t = song.tracks[addr.track];
      const slot = t?.clipSlots[addr.slot];
      if (!slot) throw new Error(`No clip slot ${addr.track}/${addr.slot}`);
      return slot;
    }
    case "arrangementClip": {
      const t = song.tracks[addr.track];
      const clip = t?.arrangementClips[addr.index];
      if (!clip) throw new Error(`No arrangement clip ${addr.track}/${addr.index}`);
      return clip;
    }
    case "scene": {
      const s = song.scenes[addr.index];
      if (!s) throw new Error(`No scene at index ${addr.index}`);
      return s;
    }
    case "cuePoint": {
      const c = song.cuePoints[addr.index];
      if (!c) throw new Error(`No cue point at index ${addr.index}`);
      return c;
    }
    case "device":
      return resolveDevice(ctx, addr.track, addr.index, addr.chain);
    case "param": {
      const dev = resolveDevice(ctx, addr.track, addr.device, addr.chain);
      const p = dev.parameters[addr.index];
      if (!p) throw new Error(`No parameter ${addr.index} on device`);
      return p;
    }
    case "mixerParam": {
      const t = trackByKind(ctx, addr.trackKind, addr.trackIndex);
      const mixer = t.mixer;
      if (addr.which === "volume") return mixer.volume;
      if (addr.which === "panning") return mixer.panning;
      const send = mixer.sends[addr.sendIndex ?? -1];
      if (!send) throw new Error(`No send ${addr.sendIndex} on track`);
      return send;
    }
  }
}

/** Index of a track within song.tracks (by handle), or null. Used for group refs. */
export function findTrackIndex(ctx: Ctx, track: DMO): number | null {
  const tracks = ctx.application.song.tracks;
  for (let i = 0; i < tracks.length; i++) {
    if (sameHandle(tracks[i]!, track)) return i;
  }
  return null;
}

/**
 * Reverse lookup: derive an Address from a live object (used by selection
 * capture). Covers the common selectable scopes; returns null if not located.
 */
export function addressOf(ctx: Ctx, obj: DMO): Address | null {
  const song = ctx.application.song;

  if (obj instanceof ableton.Track) {
    const ti = findTrackIndex(ctx, obj);
    if (ti !== null) return { kind: "track", index: ti, name: obj.name };
    for (let i = 0; i < song.returnTracks.length; i++) {
      if (sameHandle(song.returnTracks[i]!, obj)) return { kind: "returnTrack", index: i };
    }
    if (sameHandle(song.mainTrack, obj)) return { kind: "mainTrack" };
    return null;
  }

  if (obj instanceof ableton.Scene) {
    for (let i = 0; i < song.scenes.length; i++) {
      if (sameHandle(song.scenes[i]!, obj)) return { kind: "scene", index: i };
    }
    return null;
  }

  if (obj instanceof ableton.ClipSlot) {
    for (let t = 0; t < song.tracks.length; t++) {
      const slots = song.tracks[t]!.clipSlots;
      for (let s = 0; s < slots.length; s++) {
        if (sameHandle(slots[s]!, obj)) return { kind: "clipSlot", track: t, slot: s };
      }
    }
    return null;
  }

  if (obj instanceof ableton.Clip) {
    // A selected clip → locate its session slot or arrangement position.
    for (let t = 0; t < song.tracks.length; t++) {
      const track = song.tracks[t]!;
      const slots = track.clipSlots;
      for (let s = 0; s < slots.length; s++) {
        const c = slots[s]!.clip;
        if (c && sameHandle(c, obj)) return { kind: "clipSlot", track: t, slot: s };
      }
      const arr = track.arrangementClips;
      for (let a = 0; a < arr.length; a++) {
        if (sameHandle(arr[a]!, obj)) return { kind: "arrangementClip", track: t, index: a };
      }
    }
    return null;
  }

  if (obj instanceof ableton.Device) {
    // Best-effort: top-level devices only (nested rack reverse-lookup deferred).
    for (let t = 0; t < song.tracks.length; t++) {
      const devices = song.tracks[t]!.devices;
      for (let d = 0; d < devices.length; d++) {
        if (sameHandle(devices[d]!, obj)) return { kind: "device", track: t, index: d };
      }
    }
    return null;
  }

  return null;
}
