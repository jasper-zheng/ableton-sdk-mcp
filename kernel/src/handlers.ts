import * as ableton from "@ableton-extensions/sdk";
import { type Handler } from "./protocol.js";
import { type Address, resolveAddress, findTrackIndex } from "./address.js";
import {
  serializeSongOverview,
  serializeTrackFull,
  serializeDeviceFull,
  serializeClipFull,
  type OverviewOptions,
} from "./serialize.js";
import { getSelection } from "./selection.js";
import { runCode } from "./run.js";

export const handlers: Record<string, Handler> = {
  async get_context(ctx, params) {
    return { result: await serializeSongOverview(ctx, params as OverviewOptions) };
  },

  async get_track(ctx, params) {
    const addr = params.addr as Address;
    const obj = resolveAddress(ctx, addr);
    if (!(obj instanceof ableton.Track)) throw new Error("get_track requires a track address");
    const index = addr.kind === "track" ? addr.index : (findTrackIndex(ctx, obj) ?? 0);
    return { result: await serializeTrackFull(ctx, obj, index) };
  },

  async get_device(ctx, params) {
    const addr = params.addr as Address;
    if (addr?.kind !== "device") throw new Error("get_device requires a device address");
    const obj = resolveAddress(ctx, addr);
    if (!(obj instanceof ableton.Device)) throw new Error("address did not resolve to a device");
    return { result: await serializeDeviceFull(obj, addr) };
  },

  get_clip_notes(ctx, params) {
    const obj = resolveAddress(ctx, params.addr as Address);
    let clip: ableton.Clip<"1.0.0"> | null = null;
    if (obj instanceof ableton.ClipSlot) clip = obj.clip;
    else if (obj instanceof ableton.Clip) clip = obj;
    if (!clip) throw new Error("no clip at the given address");
    return { result: serializeClipFull(clip) };
  },

  get_selection() {
    return { result: { selection: getSelection() } };
  },

  async render_audio(ctx, params) {
    const obj = resolveAddress(ctx, params.addr as Address);
    if (!(obj instanceof ableton.AudioTrack)) {
      throw new Error("render_audio requires an audio track address");
    }
    const wavPath = await ctx.resources.renderPreFxAudio(
      obj,
      Number(params.startBeat),
      Number(params.endBeat),
    );
    return { result: { wavPath } };
  },

  run_code(ctx, params) {
    const timeoutMs = typeof params.timeoutMs === "number" ? params.timeoutMs : undefined;
    return runCode(ctx, String(params.code ?? ""), { timeoutMs });
  },
};
