---
name: ableton-sound-design
description: Design sounds and program native Live instruments and audio effects via the abletonsdk MCP tools — pick/insert built-in devices, set their parameters (read with ableton_get_device), build Instrument/Drum/Effect Racks and macros. Use when shaping timbre or processing sound in Live (NOT for writing MIDI notes — that's ableton-midi).
---

# Ableton sound design & devices

The *what-makes-sound* layer: insert and program native Live instruments and
effects through the **abletonsdk** MCP tools. `ableton-midi` writes the notes; this
skill makes them into a sound. Mixing-specific use of effects lives in `ableton-mixing`.

## Workflow
1. **Perceive** — `ableton_get_context` for the track/device tree; `ableton_get_device`
   on a device `addr` for its live parameters (names, current values, `min`/`max`,
   `valueItems`).
2. **Choose** — pick a built-in device (instrument or effect) by exact Live name.
3. **Act** — `ableton_run_code`: `await track.insertDevice(name, index)`, then set
   params via `await param.setValue(v)` (find params by `.name`).
4. **Verify** — `ableton_get_device` to confirm the new values.

## Setting parameters — the one rule that matters
`DeviceParameter.setValue(v)` takes a **numeric value in the parameter's own
`[min,max]`** (from `get_device`), NOT a percentage. Critically, **many continuous
params are normalized 0–1** in the SDK (e.g. Reverb `Dry/Wet`, Operator `Volume`,
filter `Frequency`) even though the Live UI shows %, Hz, or dB — while others are in
real units (EQ `Gain` ±15 dB, Glue Comp `Threshold` −40..0). **Always go by the
captured `min`/`max`.** Quantized params (`isQuantized:true`) take the **index** into
`valueItems` (e.g. EQ `Filter Type` 0–7 → `["High Pass 48dB",…]`). Helper:
```ts
async function setParam(dev, name, v) {
  const p = dev.parameters.find(x => x.name === name);
  if (!p) throw new Error("no param: " + name);
  await p.setValue(v);
  return await p.getValue();
}
```

## Reference (read on demand)
| File | When |
|------|------|
| `reference/devices-and-params.md` | The param model, the introspection procedure, normalized-vs-real units, built-in-only |
| `reference/racks-and-macros.md` | Instrument/Audio-Effect Racks, chains, macros (+ the macro-mapping limit) |
| `reference/drum-racks.md` | Drum Racks, pad↔note (`receivingNote`), building/inspecting kits, Simpler samples |
| `devices/<name>.md` | Curated per-device param tables + tips + a run_code snippet |

**Curated devices** (`devices/`): instruments — `operator`, `wavetable`, `simpler`,
`drum-rack`, `drift`; effects — `eq-eight`, `compressor`, `reverb`, `delay`,
`auto-filter`, `saturator`, `glue-compressor`, `utility`, `echo`, `chorus-ensemble`.
**Any other device** (Roar, Collision, Hybrid Reverb, …) is usable too — insert it
and read its params with `ableton_get_device` (see `devices-and-params.md`).

## Hard limits
- **Built-in Live devices only** — `insertDevice` cannot load VST/AU or presets
  (`.adv`/`.adg`); you build sounds by setting parameters, not loading presets.
- **No automation/modulation authoring** — you set a parameter's *current* value; you
  cannot draw automation or macro→param mappings via the SDK (see `racks-and-macros.md`).
- Exact device names matter (`"EQ Eight"`, `"Glue Compressor"`, `"Chorus-Ensemble"`).
- For making notes → `ableton-midi`; for balance/routing → `ableton-mixing`.
- **Before `deleteDevice` or replacing a device on the user's track**: confirm first — see **`ableton-safety`**.
