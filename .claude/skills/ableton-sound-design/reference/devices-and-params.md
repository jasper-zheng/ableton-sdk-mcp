# Devices & parameters — the model + introspection

## The DeviceParameter model
Every device exposes `parameters: DeviceParameter[]`, each:
| Field | Meaning |
|-------|---------|
| `name` | exact parameter name (use to find it) |
| `min` / `max` | the value range — **authoritative; obey it** |
| `isQuantized` | true = discrete (dropdown/switch) |
| `valueItems` | for quantized params: the labels (set the **index**, 0-based) |
| `defaultValue` | factory default |
| `getValue()` / `setValue(v)` | async read/write |

## Normalized vs real units (the #1 gotcha)
The SDK value is **not** the Live UI display. Many continuous params are **0–1
normalized** (filter `Frequency`, `Dry/Wet`, Operator `Volume`, Compressor
`Threshold`/`Ratio`/`Attack`/`Release`) even though Live shows Hz/%/dB/ms. Others are
in **real units** (EQ Eight `Gain` −15..15 dB, `Output` −12..12; Glue Comp
`Threshold` −40..0, `Output` 0..20; Operator `Transpose` −48..48; Utility `Output`/
`Balance` −1..1). **Read `min`/`max` from `get_device` and scale accordingly** — e.g.
"filter ~40% open" → `setValue(0.4)` when min=0/max=1; "+3 dB" on an EQ band →
`setValue(3)` when min=−15/max=15. There's no unit→value conversion API, so reason
from the range and listen.

## Introspection procedure (works for ANY device, curated or not)
1. Find the device `addr` from `ableton_get_context` (`devices[].addr`), or insert one.
2. `ableton_get_device {addr}` → full param list with current values, ranges, value labels.
3. Set what you need via `run_code` + `setValue` (index for quantized).
```ts
// generic: insert a device and report its params (use for non-curated devices)
const song = context.application.song;
const track = song.tracks[0];                       // resolve via get_context addr in practice
const dev = await track.insertDevice("Roar", track.devices.length);
return dev.parameters.slice(0, 40).map(p => ({
  name: p.name, min: p.min, max: p.max,
  q: p.isQuantized, items: p.isQuantized ? p.valueItems.map(v => v.shortName) : undefined,
}));
```
The curated `devices/*.md` files exist so you don't have to introspect the common
devices every time — they give the key params + recipes. For anything else,
introspect live.

## Inserting / removing
- `await track.insertDevice(name, index)` — built-in Live device by **exact name**;
  returns the `Device`. Index = position in the chain (use `track.devices.length` to append).
- `await track.deleteDevice(dev)` / `await track.duplicateDevice(dev)`.
- **No VST/AU, no preset (`.adv`/`.adg`) loading** — parameters only.
- A MIDI track needs an **instrument** before any audio effect will be heard
  (insert the instrument first / at a lower index).

## Quantized example
```ts
// EQ Eight: turn band 1 into a high-pass (valueItems index 0 = "High Pass 48dB")
const eq = track.devices.find(d => d.name === "EQ Eight");
const type = eq.parameters.find(p => p.name === "1 Filter Type A");
await type.setValue(0);                               // index into valueItems
await eq.parameters.find(p => p.name === "1 Frequency A").setValue(0.25);  // 0–1 normalized
```

## Device-specific instruments
`Simpler` adds `sample` + `replaceSample(filePath)` (load a sample by path — see
`drum-racks.md`). `RackDevice`/`DrumRack` add chains/macros (see `racks-and-macros.md`).
