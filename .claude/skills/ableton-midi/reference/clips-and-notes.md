# MIDI clips & the note model

All facts here are verified live against the Extensions SDK (WP0–WP3). For the
authoritative types read the MCP resource `ableton://api/sdk`.

## Tracks
```ts
const song = context.application.song;
const track = await song.createMidiTrack();   // MidiTrack; inserted AFTER selected track, else appended
track.name = "Lead";
// new tracks are NOT necessarily last — resolve the real index by handle:
const idx = song.tracks.findIndex(t => t.handle.id === track.handle.id);
```
`song.tracks` excludes return tracks and the main track. Built-in instruments only:
`await track.insertDevice("Operator", 0)` (no VST/AU/preset loading). A MIDI track
needs an instrument to make sound — see the `ableton-sound-design` skill.

## Creating a clip — two distinct methods
| View | Call | Args | Notes |
|------|------|------|-------|
| **Session** | `track.clipSlots[i].createMidiClip(length)` | `length` in beats | lands in clip-slot `i` |
| **Arrangement** | `track.createMidiClip(startTime, duration)` | beats, beats | on a `MidiTrack`; placed on the timeline at `startTime` |

Both return a `MidiClip` (await them). **Clip length and loop points are fixed at
creation** — there is no setter for timing/markers, so pick the length up front.

```ts
// Session: a 4-beat (1-bar) clip in slot 0
const clip = await track.clipSlots[0].createMidiClip(4);

// Arrangement: a 2-bar clip starting at bar 3 (beat 8)
const clip = await track.createMidiClip(8, 8);
clip.looping = false;   // arrangement clips LOOP BY DEFAULT — disable for one-shots
```

## The note model
`clip.notes` is a get/set array of `NoteDescription`:

| Field | Type | Meaning |
|-------|------|---------|
| `pitch` | 0–127 | MIDI note number (60 = C3 in Live's convention) |
| `startTime` | beats | **clip-relative** position (0 = clip start) |
| `duration` | beats | note length |
| `velocity` | 1–127 | loudness (optional, default ~100) |
| `probability` | 0–1 | chance the note plays (optional) |
| `velocityDeviation` | number | random velocity spread (optional) |
| `muted` | bool | note disabled (optional) |

Setting is **synchronous and wholesale** — assign the full array (read-modify-write
to edit existing notes):
```ts
clip.notes = [
  { pitch: 60, startTime: 0, duration: 1, velocity: 100 },
  { pitch: 64, startTime: 1, duration: 1, velocity: 100 },
  { pitch: 67, startTime: 2, duration: 1, velocity: 100 },
];
return { name: clip.name, noteCount: clip.notes.length };
```
To edit: `const ns = clip.notes.map(n => ({ ...n, velocity: 80 })); clip.notes = ns;`

## Pitch ↔ name
`pitch = (octave + 2) * 12 + pitchClass`, where C=0, C#=1, …, B=11. So C3 = 60,
A3 = 69, A2 (common bass A) = 45. Middle-C labeling differs by DAW; Live shows
MIDI 60 as **C3**.

## Reading back
`ableton_get_clip_notes` with the clip's `addr`:
- Session: `{ kind:"clipSlot", track:<i>, slot:<j> }`
- Arrangement: `{ kind:"arrangementClip", track:<i>, index:<k> }`

Returns clip meta (`startTime`/`endTime`/`duration`/`looping`/`color`) + full `notes[]`.

## Grouping edits
`withinTransaction(fn)` groups **independent** mutations into one undo step (it's
synchronous — can't `await` inside; for async use `return Promise.all([...])`).
There is no programmatic undo; rely on Live's native undo.

## run_code syntax note — modern operators work
`??` (nullish coalescing), `?.` (optional chaining), `??=`, numeric separators
(`1_000`), and class fields all run natively (the kernel passes them straight to
its Node ≥24 host; verified live). The explicit equivalents used in some snippets
here (`(a == null ? b : a)`, `(obj && obj.prop)`, `if (!m[k]) m[k]=[]`) are still
correct — use whichever you prefer.
(Historical: these threw `_nullishCoalesce is not defined` before the WP2 follow-up
fix that set sucrase `disableESTransforms: true`.)
