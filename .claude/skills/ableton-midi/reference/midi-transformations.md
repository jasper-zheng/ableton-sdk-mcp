# Reproducing Live's MIDI Tools in run_code

Live 12's **MIDI Tools** (Transform & Generate panels of the Clip View) are
interactive and **not exposed in the SDK**. But you have full `clip.notes` control,
so you can reproduce their *effect* directly. Below: what each tool does (manual
ch11) + a note-array recipe. Read-modify-write `clip.notes` to apply.

Convention: `notes` is `clip.notes` (an array of `{pitch,startTime,duration,velocity,...}`);
`G` is a grid step in beats (e.g. `0.25` = 1/16). All transforms are scale-agnostic
here — to keep results in key, run pitches through `snapToScale` (see scales-and-harmony.md).

## Transformations (operate on existing notes)

**Arpeggiate** — split a chord/selection into a sequence. Take simultaneous notes,
re-emit them one per step in order (up/down/updown):
```ts
function arpeggiate(notes, step = 0.25, style = "up") {
  const byTime = {};
  for (const n of notes) { if (!byTime[n.startTime]) byTime[n.startTime] = []; byTime[n.startTime].push(n); }
  const out = [];
  for (const t of Object.keys(byTime).map(Number).sort((a,b)=>a-b)) {
    let ps = byTime[t].map(n=>n.pitch).sort((a,b)=>a-b);
    if (style === "down") ps = ps.reverse();
    if (style === "updown") ps = [...ps, ...ps.slice(1,-1).reverse()];
    ps.forEach((p,i) => out.push({ pitch:p, startTime:t+i*step, duration:step, velocity: byTime[t][0].velocity == null ? 100 : byTime[t][0].velocity }));
  }
  return out;
}
```

**Strum** — offset chord-note start times by pitch so they don't hit at once
(low→high = up-strum). `spread` in beats:
```ts
const strum = (notes, spread = 0.05) => {
  const byTime = {};
  for (const n of notes) { if (!byTime[n.startTime]) byTime[n.startTime] = []; byTime[n.startTime].push(n); }
  const out = [];
  for (const grp of Object.values(byTime)) {
    grp.sort((a,b)=>a.pitch-b.pitch).forEach((n,i)=> out.push({ ...n, startTime: n.startTime + i*spread }));
  }
  return out;
};
```

**Ornament (Flam / Grace)** — prepend a quick note before each note. Flam = one
soft pre-hit; grace = short approach note a step above/below:
```ts
const flam = (notes, off = 0.03, vel = 0.6) =>
  notes.flatMap(n => [{ ...n, startTime: n.startTime - off, duration: off, velocity: Math.round((n.velocity == null ? 100 : n.velocity)*vel) }, n]);
```

**Quantize** — see `quantize-and-groove.md`.

**Recombine** — permute one dimension across the note set (Shuffle/Mirror/Rotate).
E.g. Mirror velocities (reverse the velocity sequence over the same positions):
```ts
function recombineMirror(notes, dim = "velocity") {
  const sorted = [...notes].sort((a,b)=>a.startTime-b.startTime);
  const vals = sorted.map(n=>n[dim]).reverse();
  return sorted.map((n,i)=>({ ...n, [dim]: vals[i] }));
}
```
Rotate = cyclic shift of `vals` by k; Shuffle = random permutation of `vals`.

**Span (legato/staccato)** — reshape durations. Legato: extend each note to the
next note's start. Staccato: clamp to a short fixed length:
```ts
function legato(notes) {
  const s = [...notes].sort((a,b)=>a.startTime-b.startTime);
  return s.map((n,i)=> i<s.length-1 ? { ...n, duration: Math.max(0.01, s[i+1].startTime - n.startTime) } : n);
}
const staccato = (notes, len = 0.1) => notes.map(n => ({ ...n, duration: Math.min(n.duration, len) }));
```

**Connect / Chop / Time Warp / Glissando / LFO / Velocity Shaper** — same idea:
Chop = subdivide a note into N equal parts; Connect = fill gaps between notes with
interpolated pitches; Time Warp = remap `startTime` along a speed curve;
Velocity Shaper = set `velocity` from an envelope `f(position)`. Glissando/LFO are
MPE (pitch-bend/pressure) — not representable as plain notes; skip for v1.

## Generators (create new notes)

**Stacks (chord progression generator)** — build chords on chosen roots/inversions:
use `triadOnDegree` / seventh-chord helpers from `scales-and-harmony.md`.

**Rhythm / Euclidean** — generate a step pattern for one pitch. Euclidean spreads
`k` hits as evenly as possible over `n` steps:
```ts
function euclid(k, n) {  // returns boolean[n]
  const out = []; let bucket = 0;
  for (let i=0;i<n;i++){ bucket += k; if (bucket>=n){ bucket-=n; out.push(true);} else out.push(false);} return out;
}
function rhythmNotes(pitch, n, k, step = 0.25, vel = 100) {
  return euclid(k,n).map((on,i)=> on && { pitch, startTime:i*step, duration:step, velocity:vel }).filter(Boolean);
}
```

**Seed / Shape** — random/curve-driven note generation within pitch & velocity
ranges; build with `Math.random()` (Seed) or a shape function `pitch=f(i)` (Shape),
then `snapToScale` to stay in key. **You own any randomness** — listen/verify.
