---
name: ableton-mixing
description: Mix a track in Ableton Live via the abletonsdk MCP tools — set track volume/pan, sends to return tracks, gain staging, and insert/adjust mixing effects (EQ, compression, reverb/delay sends). Use when balancing levels, panning, routing to returns, or processing the mix bus (NOT for writing notes — that's ableton-midi).
---

# Ableton mixing

The *balance & routing* layer: set levels, pan, sends, and insert mixing effects.
Device parameter mechanics live in `ableton-sound-design`; this skill is about the
mixer and how to use those devices to balance a mix.

## Workflow
1. **Perceive** — `ableton_get_context` already includes each track's **mixer values**
   (volume, panning, sends) + return/main tracks. Read current levels first.
2. **Act** — `ableton_run_code`: set `track.mixer.{volume,panning,sends[i]}` via
   `setValue`; insert mixing devices (`EQ Eight`, `Compressor`, `Glue Compressor`,
   `Utility`) and set their params (see `ableton-sound-design/devices/`).
3. **Verify** — `ableton_get_context` again (mixer values reflect the change).

## Mixer parameters
`track.mixer.volume`, `track.mixer.panning`, `track.mixer.sends[i]` are
`DeviceParameter`s — **read their `min`/`max`** (volume is normalized, ~0.85 ≈ 0 dB;
panning −1..1; sends 0–1). Tool addressing:
`{kind:"mixerParam", trackKind:"track"|"return"|"main", which:"volume"|"panning"|"send", trackIndex, sendIndex}`.

## Reference (read on demand)
| File | When |
|------|------|
| `reference/mixer-and-routing.md` | Volume/pan/sends, return & main tracks, group tracks, send→return effects |
| `reference/mixing-techniques.md` | Gain staging, EQ carving, compression, (limited) sidechain, balance approach |

Mixing **devices** (EQ Eight, Compressor, Glue Compressor, Utility, …) are documented
once in `ableton-sound-design/devices/` — this skill links to them rather than repeating.

## Hard limits
- **No metering / no master audio** — `ableton_render_audio` is **pre-FX, per audio
  track**; there's no post-FX/master capture and no level meters. Mix by parameter
  values + musical reasoning, not by measuring output.
- **No volume/sidechain automation** — set static values only (see `ableton-arrangement/automation.md`).
- **External sidechain routing** isn't settable (you can enable a comp's `S/C On` but
  not pick its source) — note this when asked for true sidechain pumping.
