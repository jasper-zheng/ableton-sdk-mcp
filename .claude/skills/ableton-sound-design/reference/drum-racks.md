# Drum Racks (manual ch24.6)

A **Drum Rack** is a rack whose chains each respond to a **single MIDI note** (a
"pad"). The General-MIDI-ish default map starts at **36 = C1 kick, 38 = snare,
42 = closed hat, 46 = open hat** (pads ascend chromatically). Trigger pads by writing
those pitches in a MIDI clip (`ableton-midi`).

## SDK surface
- `DrumRack` extends `RackDevice`: `chains: DrumChain[]`.
- `DrumChain` extends `Chain`: adds **`receivingNote`** (get/set) — the MIDI note that
  triggers this pad. Plus the usual `devices`, `insertDevice`, `mixer`.
- Pad sound = a chain containing a `Simpler` (or `Drum Sampler`/`Impulse`) +
  optional audio effects. `Simpler.replaceSample(filePath)` loads the sample.

## Inspect an existing kit
```ts
const song = context.application.song;
const dr = song.tracks[0].devices.find(d => d.name === "Drum Rack");
return dr.chains.map(ch => ({
  note: ch.receivingNote,
  devices: ch.devices.map(d => d.name),
}));
```

## Build a pad from a sample
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Kit";
const dr = await track.insertDevice("Drum Rack", 0);     // DrumRack
const pad = await dr.insertChain(0);                      // a DrumChain
pad.receivingNote = 36;                                   // C1 = kick pad
const simpler = await pad.insertDevice("Simpler", 0);
await simpler.replaceSample("/absolute/path/to/kick.wav");// needs a real file path
return { pads: dr.chains.length, note: dr.chains[0].receivingNote };
```
**Sample paths:** `replaceSample` needs an accessible absolute file path; the SDK
can't browse Live's library. If you don't have a path, insert `Drum Sampler`/`Simpler`
and set parameters, or ask the user for sample locations.

## Map / remap pads
Set `receivingNote` to change which note a pad answers to. To split a single drum
pattern across processing, give pads different `receivingNote`s and write the matching
pitches in the clip. (Choke groups, send chains, and Pad-View drag-mapping from the
manual are not in the SDK.)

## Drums + composition
For *what to program* (linear drumming, ghost notes, 3+3+2, top/bottom), see
`music-strategies/rhythm.md`; for the note arrays + Euclidean/accent helpers, see
`ableton-midi` (`examples.md` recipe 3, `quantize-and-groove.md`).
