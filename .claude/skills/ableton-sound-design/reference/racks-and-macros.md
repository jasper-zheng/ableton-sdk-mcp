# Racks & macros (manual ch24)

A **Rack** wraps one or more parallel device **chains** into a single device, plus up
to 16 **Macro Controls**. Four types: **Instrument**, **Audio Effect**, **MIDI
Effect**, **Drum** (drum racks: see `drum-racks.md`).

## SDK surface
- `RackDevice` extends `Device`: `chains: Chain[]`, `insertChain(index)`.
- `Chain`: `devices`, `insertDevice(name, i)`, `deleteDevice(d)`, `mixer` (ChainMixer:
  `volume`, `panning`, `sends[]`).
- Macros are exposed as ordinary `DeviceParameter`s on the rack named `"Macro 1"…"Macro 16"`
  (range 0–127 when unmapped/multi-mapped).

## Signal flow (parallel chains)
Each chain in an Instrument/Audio-Effect Rack gets the **same input**, processes
serially through its devices, and the chain outputs are **mixed**. Device-order rules
inside an Instrument Rack: MIDI effects → instrument → audio effects.

## Build a rack programmatically
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Layered";
const rack = await track.insertDevice("Instrument Rack", 0);   // a RackDevice
// add two parallel chains, each with its own instrument
const c1 = await rack.insertChain(0);
await c1.insertDevice("Operator", 0);
const c2 = await rack.insertChain(1);
await c2.insertDevice("Wavetable", 0);
await c2.mixer.volume.setValue(await c2.mixer.volume.getValue());  // chain-level mix
return { chains: rack.chains.length };
```
You can also wrap an existing device chain conceptually, but the SDK builds racks by
`insertChain` + `insertDevice` as above. Generic empty-rack names: `"Instrument Rack"`,
`"Audio Effect Rack"`, `"MIDI Effect Rack"`, `"Drum Rack"`.

## Macro Controls
- **Set a macro value:** it's a parameter — `rack.parameters.find(p=>p.name==="Macro 1").setValue(v)` (0–127).
- **Randomize-by-hand:** vary the macro values yourself; there's no SDK "Rand" call.
- **LIMIT — macro *mappings* are not SDK-creatable.** You cannot assign which device
  parameters a macro controls, set macro Min/Max ranges, or create macro variations via
  the SDK. Macros you *set* only have audible effect if the rack/preset already maps
  them — and you can't load presets. **Practical consequence:** to "control" a sound,
  set the underlying device parameters directly (the curated `devices/*.md` approach)
  rather than relying on macros. Mention this limit when a user asks for macro mappings.

## Chain mixing
`chain.mixer.volume` / `panning` / `sends[i]` are `DeviceParameter`s — balance the
layers of a rack the same way you balance tracks (see `ableton-mixing`). Each chain
also has its own activator/solo in Live, not exposed in the SDK.

## Zones (key / velocity / chain-select)
Instrument/MIDI-Effect rack chains have key/velocity/chain-select **zones** (keyboard
splits, velocity layers, preset banks via the Chain selector). These are **not exposed
in the SDK** — document as a limit if asked; achieve splits instead by routing notes
to separate tracks (`ableton-midi`, sound-color/hocket patterns).
