# Scales & harmony as run_code helpers

Music *theory* lives in the `music-strategies` skill (harmony.md). This file is the
**execution** layer: turning scale/chord intent into MIDI note arrays. Work in
12TET (the SDK has no tuning-system API).

## Read the Set's key first
`ableton_get_context` returns the Set's scale:
```jsonc
"scale": { "rootNote": 9, "scaleName": "Minor", "scaleMode": true, "scaleIntervals": [0,2,3,5,7,8,10] }
```
`rootNote` 0–11 (C=0 … A=9 … B=11). `scaleIntervals` are semitone offsets of the
scale degrees from the root. If `scaleMode` is true, prefer staying in-scale.

## Scale interval tables (semitones from root)
| Scale | Intervals |
|-------|-----------|
| Major (Ionian) | 0 2 4 5 7 9 11 |
| Natural minor (Aeolian) | 0 2 3 5 7 8 10 |
| Harmonic minor | 0 2 3 5 7 8 11 |
| Dorian | 0 2 3 5 7 9 10 |
| Phrygian | 0 1 3 5 7 8 10 |
| Lydian | 0 2 4 6 7 9 11 |
| Mixolydian | 0 2 4 5 7 9 10 |
| Pentatonic major | 0 2 4 7 9 |
| Pentatonic minor | 0 3 5 7 10 |

## Helpers (paste into run_code)
```ts
// MIDI pitch for a scale degree (1-based). degree can exceed the scale length
// (wraps to higher octaves). root = 0..11 pitch class, octave anchors absolute pitch.
function degreeToPitch(root, intervals, octave, degree) {
  const n = intervals.length;
  const i = ((degree - 1) % n + n) % n;
  const oct = octave + Math.floor((degree - 1) / n);
  return (oct + 2) * 12 + root + intervals[i];
}

// Diatonic triad (root/3rd/5th) on a given scale degree, stacking thirds in-scale.
function triadOnDegree(root, intervals, octave, degree) {
  return [degree, degree + 2, degree + 4].map(d => degreeToPitch(root, intervals, octave, d));
}

// Snap any pitch to the nearest in-scale pitch (keeps stray notes in key).
function snapToScale(pitch, root, intervals) {
  const pc = ((pitch - root) % 12 + 12) % 12;
  let best = intervals[0], bestD = 99;
  for (const iv of intervals) { const d = Math.min((pc-iv+12)%12,(iv-pc+12)%12); if (d<bestD){bestD=d;best=iv;} }
  return pitch + ((best - pc + 6) % 12 - 6);
}
```

## Diatonic chord qualities (Roman numerals)
- **Major key:** I ii iii IV V vi vii° (uppercase = major triad, lowercase = minor, ° = diminished).
- **Natural minor:** i ii° III iv v VI VII.
- **Functional motion (major):** after **I** anything; **V**/vii° → I (V can → vi);
  **ii**/**IV** → V/vii° (IV can → I or ii); **vi** → ii/IV; **iii** → vi.
- **Seventh chords:** add the scale's 7th-above the root (degrees `[d, d+2, d+4, d+6]`).
  V7 = dominant 7 (strong pull to I). Jazz-flavor a triad progression by using 7ths.
- **Voicing/inversions** for smooth motion: minimize semitone movement and keep
  common tones — see `music-strategies/harmony.md` (voice leading). To invert,
  move the lowest note up an octave (or a chord tone down).

## Building a progression
```ts
const song = context.application.song;
const { rootNote: root, scaleIntervals: iv } = { rootNote: 9, scaleIntervals: [0,2,3,5,7,8,10] }; // A minor; or read from get_context
const degrees = [1, 7, 6, 4];           // i - VII - VI - IV (a common minor loop; for major use I V vi IV)
const track = await song.createMidiTrack();
const clip = await track.clipSlots[0].createMidiClip(degrees.length * 4); // 1 bar each
const notes = [];
degrees.forEach((deg, bar) => {
  triadOnDegree(root, iv, 1, deg).forEach(p => notes.push({ pitch: p, startTime: bar*4, duration: 4, velocity: 90 }));
});
clip.notes = notes;
return { bars: degrees.length, noteCount: notes.length };
```
(Define `degreeToPitch`/`triadOnDegree` in the same snippet.)
