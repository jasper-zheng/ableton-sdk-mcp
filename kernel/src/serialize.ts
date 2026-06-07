import * as ableton from "@ableton-extensions/sdk";
import type { Ctx } from "./protocol.js";
import { type Address, findTrackIndex } from "./address.js";

type Track = ableton.Track<"1.0.0">;
type Clip = ableton.Clip<"1.0.0">;
type Device = ableton.Device<"1.0.0">;
type DeviceParameter = ableton.DeviceParameter<"1.0.0">;
type TrackMixer = ableton.TrackMixer<"1.0.0">;
type ChainMixer = ableton.ChainMixer<"1.0.0">;

const MAX_RACK_DEPTH = 2;

function deviceType(d: Device): string {
  if (d instanceof ableton.Simpler) return "Simpler";
  if (d instanceof ableton.DrumRack) return "DrumRack";
  if (d instanceof ableton.RackDevice) return "RackDevice";
  return "Device";
}

function clipType(c: Clip): "midi" | "audio" | "clip" {
  if (c instanceof ableton.MidiClip) return "midi";
  if (c instanceof ableton.AudioClip) return "audio";
  return "clip";
}

function gridQuantizationName(q: number): string {
  const name = (ableton.GridQuantization as unknown as Record<number, string>)[q];
  return name ?? String(q);
}

// ---- clips -------------------------------------------------------------

/** Cheap, sync clip summary (note count is a sync getter, so it is included). */
export function serializeClipSummary(clip: Clip) {
  const type = clipType(clip);
  const base = {
    name: clip.name,
    type,
    startTime: clip.startTime,
    endTime: clip.endTime,
    duration: clip.duration,
    looping: clip.looping,
    loopStart: clip.loopStart,
    loopEnd: clip.loopEnd,
    muted: clip.muted,
    color: clip.color,
  };
  if (clip instanceof ableton.MidiClip) {
    return { ...base, noteCount: clip.notes.length };
  }
  if (clip instanceof ableton.AudioClip) {
    return { ...base, warping: clip.warping, warpMode: WarpMode_name(clip.warpMode), filePath: clip.filePath };
  }
  return base;
}

function WarpMode_name(w: number): string {
  const name = (ableton.WarpMode as unknown as Record<number, string>)[w];
  return name ?? String(w);
}

/** Full clip detail: summary + MIDI notes, or audio warp markers. */
export function serializeClipFull(clip: Clip) {
  const summary = serializeClipSummary(clip);
  if (clip instanceof ableton.MidiClip) {
    return { ...summary, notes: clip.notes };
  }
  if (clip instanceof ableton.AudioClip) {
    return { ...summary, warpMarkers: clip.warpMarkers };
  }
  return summary;
}

// ---- parameters & devices ---------------------------------------------

export function serializeParamMeta(p: DeviceParameter) {
  return {
    name: p.name,
    min: p.min,
    max: p.max,
    isQuantized: p.isQuantized,
    defaultValue: p.defaultValue,
    valueItems: p.valueItems,
  };
}

export async function serializeParamWithValue(p: DeviceParameter) {
  return { ...serializeParamMeta(p), value: await p.getValue() };
}

/** Full device detail incl. current parameter values and (depth-guarded) rack chains. */
export async function serializeDeviceFull(
  device: Device,
  addr: Extract<Address, { kind: "device" }>,
  depth = 0,
): Promise<unknown> {
  const parameters = await Promise.all(device.parameters.map((p) => serializeParamWithValue(p)));
  const out: Record<string, unknown> = {
    addr,
    name: device.name,
    type: deviceType(device),
    parameters,
  };
  if (device instanceof ableton.RackDevice && depth < MAX_RACK_DEPTH) {
    out.chains = await Promise.all(
      device.chains.map(async (chain, ci) => ({
        index: ci,
        mixer: await serializeChainMixer(chain.mixer),
        devices: await Promise.all(
          chain.devices.map((d, di) =>
            serializeDeviceFull(
              d,
              { kind: "device", track: addr.track, index: addr.index, chain: [...(addr.chain ?? []), ci, di] },
              depth + 1,
            ),
          ),
        ),
      })),
    );
  }
  return out;
}

// ---- mixers ------------------------------------------------------------

async function serializeMixer(mixer: TrackMixer) {
  return {
    volume: await mixer.volume.getValue(),
    panning: await mixer.panning.getValue(),
    sends: await Promise.all(mixer.sends.map((s) => s.getValue())),
  };
}

async function serializeChainMixer(mixer: ChainMixer) {
  return {
    volume: await mixer.volume.getValue(),
    panning: await mixer.panning.getValue(),
    sends: await Promise.all(mixer.sends.map((s) => s.getValue())),
  };
}

// ---- tracks ------------------------------------------------------------

export interface OverviewOptions {
  includeReturns?: boolean;
  includeMain?: boolean;
  includeDevices?: boolean;
}

async function serializeTrackOverview(
  ctx: Ctx,
  track: Track,
  index: number,
  opts: OverviewOptions,
) {
  const group = track.groupTrack ? findTrackIndex(ctx, track.groupTrack) : null;
  const clipSlots = track.clipSlots.map((slot, s) => {
    const c = slot.clip;
    return { slot: s, hasClip: !!c, clip: c ? serializeClipSummary(c) : null };
  });
  const devices =
    opts.includeDevices === false
      ? undefined
      : track.devices.map((d, di) => ({
          index: di,
          name: d.name,
          type: deviceType(d),
          paramCount: d.parameters.length,
          addr: { kind: "device", track: index, index: di } as Address,
        }));
  return {
    addr: { kind: "track", index, name: track.name } as Address,
    index,
    name: track.name,
    type: track instanceof ableton.MidiTrack ? "midi" : track instanceof ableton.AudioTrack ? "audio" : "other",
    mute: track.mute,
    solo: track.solo,
    mutedViaSolo: track.mutedViaSolo,
    arm: track.arm,
    groupTrackIndex: group,
    mixer: await serializeMixer(track.mixer),
    clipSlots,
    devices,
  };
}

/** Light serialization for return/main tracks (no per-device addressing in WP1). */
async function serializeAuxTrack(track: Track, addr: Address) {
  return {
    addr,
    name: track.name,
    mute: track.mute,
    solo: track.solo,
    mixer: await serializeMixer(track.mixer),
    deviceNames: track.devices.map((d) => d.name),
  };
}

// ---- full track --------------------------------------------------------

export async function serializeTrackFull(ctx: Ctx, track: Track, index: number) {
  const overview = await serializeTrackOverview(ctx, track, index, { includeDevices: true });
  const sessionClips = track.clipSlots.map((slot, s) => {
    const c = slot.clip;
    return { slot: s, clip: c ? serializeClipFull(c) : null };
  });
  const arrangementClips = track.arrangementClips.map((c, i) => ({ index: i, clip: serializeClipFull(c) }));
  const takeLanes = track.takeLanes.map((lane, i) => ({
    index: i,
    name: lane.name,
    clips: lane.clips.map((c) => serializeClipFull(c)),
  }));
  const devices = await Promise.all(
    track.devices.map((d, di) => serializeDeviceFull(d, { kind: "device", track: index, index: di })),
  );
  return { ...overview, sessionClips, arrangementClips, takeLanes, devices };
}

// ---- song overview -----------------------------------------------------

export async function serializeSongOverview(ctx: Ctx, opts: OverviewOptions) {
  const song = ctx.application.song;

  const tracks = await Promise.all(
    song.tracks.map((t, i) => serializeTrackOverview(ctx, t, i, opts)),
  );

  const scenes = song.scenes.map((s, i) => ({
    addr: { kind: "scene", index: i } as Address,
    index: i,
    name: s.name,
    tempo: s.tempo,
    signature: `${s.signatureNumerator}/${s.signatureDenominator}`,
  }));

  const cuePoints = song.cuePoints.map((c, i) => ({
    addr: { kind: "cuePoint", index: i } as Address,
    index: i,
    name: c.name,
    time: c.time,
  }));

  const result: Record<string, unknown> = {
    tempo: song.tempo,
    scale: {
      rootNote: song.rootNote,
      scaleName: song.scaleName,
      scaleMode: song.scaleMode,
      scaleIntervals: song.scaleIntervals,
    },
    grid: { quantization: gridQuantizationName(song.gridQuantization), isTriplet: song.gridIsTriplet },
    trackCount: tracks.length,
    sceneCount: scenes.length,
    tracks,
    scenes,
    cuePoints,
  };

  if (opts.includeReturns !== false) {
    result.returnTracks = await Promise.all(
      song.returnTracks.map((t, i) => serializeAuxTrack(t, { kind: "returnTrack", index: i })),
    );
  }
  if (opts.includeMain !== false) {
    result.mainTrack = await serializeAuxTrack(song.mainTrack, { kind: "mainTrack" });
  }

  return result;
}
