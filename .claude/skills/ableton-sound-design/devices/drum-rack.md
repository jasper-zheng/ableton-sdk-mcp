# Drum Rack (device file)

`insertDevice("Drum Rack", i)`. A rack of one-note pads — see the full guide in
`../reference/drum-racks.md`. Its own parameters are just the macros:

## Parameters
| Param | Range | Notes |
|-------|-------|------|
| `Macro 1`…`Macro 16` | 0–127 | rack macros (only audible if mapped — mappings aren't SDK-creatable) |

The musical controls live on the **chains** (`DrumRack.chains` → `DrumChain` with
`receivingNote`, `devices`, `mixer`), not on these top-level params. Default pad notes:
36 kick, 38 snare, 42 closed hat, 46 open hat (ascending chromatically).

## Common operations
```ts
// inspect an existing kit's pad map
const dr = track.devices.find(d => d.name === "Drum Rack");
const pads = dr.chains.map(ch => ({ note: ch.receivingNote, devices: ch.devices.map(d => d.name) }));

// add a sampled pad
const pad = await dr.insertChain(0);
pad.receivingNote = 36;
const simpler = await pad.insertDevice("Simpler", 0);
await simpler.replaceSample("/abs/path/kick.wav");
```

## Tips
- Trigger pads by writing their `receivingNote` pitches in a MIDI clip (`ableton-midi`).
- Balance the kit via each `chain.mixer.volume`/`panning`.
- For *what beats to program*, see `music-strategies/rhythm.md`; for note arrays +
  Euclidean/accents, `ableton-midi`.

(Choke groups, send chains, Pad-View drag-mapping: UI-only, not in the SDK.)
