# Quantize, swing & groove (in run_code)

Live's **Groove Pool** (.agr grooves) and the Quantize MIDI Tool are not in the
SDK. Reproduce their effect by editing note `startTime`/`velocity`. The Groove Pool
model (manual ch14) is the conceptual guide: **Base** (grid), **Quantize** (snap
amount), **Timing** (groove push), **Random** (humanize), **Velocity**.

`G` = grid step in beats: 1/4=1, 1/8=0.5, 1/16=0.25, 1/8T (triplet)=1/3.

## Quantize to grid (with strength)
`amount` 0–1 = how far to move toward the grid (Live's "Amount" / 50% feel). 1.0 =
hard snap; <1 keeps human feel:
```ts
function quantize(notes, G = 0.25, amount = 1, ends = false) {
  const snap = t => { const q = Math.round(t / G) * G; return t + (q - t) * amount; };
  return notes.map(n => ends
    ? { ...n, startTime: snap(n.startTime), duration: Math.max(0.01, snap(n.startTime+n.duration) - snap(n.startTime)) }
    : { ...n, startTime: snap(n.startTime) });
}
```

## Swing / shuffle
Delay the off-grid subdivisions (every other grid step) to create swing.
`swing` 0–~0.4 of a grid step:
```ts
function swing(notes, G = 0.25, amount = 0.2) {
  return notes.map(n => {
    const idx = Math.round(n.startTime / G);
    return idx % 2 === 1 ? { ...n, startTime: n.startTime + G * amount } : n;
  });
}
```

## Humanize (timing + velocity jitter)
Best applied to on-grid material (the Groove Pool "Random"). Note: apply *different*
offsets per note so simultaneous notes detach slightly — that's what makes it feel alive.
```ts
function humanize(notes, timing = 0.012, vel = 8) {
  const j = a => (Math.random() * 2 - 1) * a;
  return notes.map(n => ({
    ...n,
    startTime: Math.max(0, n.startTime + j(timing)),
    velocity: Math.max(1, Math.min(127, Math.round((n.velocity == null ? 100 : n.velocity) + j(vel)))),
  }));
}
```

## Feel without randomness — push/pull a layer
"Behind the beat" (laid-back) vs "ahead" (driving). **Only audible if some elements
move and others don't** — e.g. shift the snare/hat late while kick stays on grid:
```ts
const shift = (notes, beats) => notes.map(n => ({ ...n, startTime: Math.max(0, n.startTime + beats) }));
// laid-back hats: shift(hatNotes, +0.02); driving: shift(..., -0.02)
```

## Velocity accents (groove from dynamics alone)
Even perfectly-quantized hats come alive with accents — emphasize strong subdivisions
(odd-numbered are stronger; in 4/4 beats 1 & 3 strongest):
```ts
function accent(notes, G = 0.25, strong = 110, weak = 70) {
  return notes.map(n => { const idx = Math.round(n.startTime / G); return { ...n, velocity: idx % 2 === 0 ? strong : weak }; });
}
```

## Non-destructive vs committed
The Groove Pool applies grooves non-destructively until "Commit". You have no live
groove object, so every edit here is destructive to `clip.notes` — work on a copy
of the array and only assign back when satisfied (and rely on Live's undo).
