# Playbook: 8-bar loop

## Goal / when to use
Produce a coherent, in-key **8-bar loop** — Drums + Bass + Chords + Lead, each on its
own track with an instrument and a rough mix, as one launchable **Session scene**
(`clipSlots[0]` across the four tracks). Use for "make me a loop / a beat with bass and
chords / sketch a track idea". This is the flagship that exercises every WP4 skill.

## Parameters + defaults (runs with zero input)
| Param | Default | Notes |
|-------|---------|------|
| key | the Set's `scale` (`rootNote`/`scaleIntervals`), else A minor | perceive first; coherence |
| tempo | the Set's `tempo` | don't change it unless asked |
| bars | 8 | clip length = `bars*4` beats |
| progression | `[1, 6, 4, 5]` (I–vi–IV–V / i–VI–iv–v), 2 bars each | scale degrees |
| feel | four-on-the-floor + offbeat hats | see Variations |
| instruments | Wavetable (pad), Operator (bass), Drum Rack (drums), Drift (lead) | swap freely |

## Procedure
1. **Perceive** (`ableton_get_context`): read `tempo`, `scale`, existing tracks.
2. **Plan** (`music-strategies`): progression (`harmony.md`), 4-on-floor beat + bass on
   offbeats as a **bass+kick composite** (`rhythm.md`), arc **lead** with a single peak
   (`melody.md`). Keep everything in one key via `ableton-midi/scales-and-harmony.md`
   `degreeToPitch`.
3. **Build + write** (`ableton-sound-design` + `ableton-midi`): run the consolidated
   script below (creates 4 tracks, inserts instruments, writes the four 8-bar clips).
   **Safety** (`ableton-safety`): `ui.confirm` the plan **before building**; wrap the
   build in one `withinTransaction(() => Promise.all([...]))` so a single Cmd-Z reverts it.
4. **Mix** (`ableton-mixing`): the script sets rough static levels + slight pan.
5. **Verify**: `ableton_get_clip_notes` on the chord/bass/lead clips → notes in key;
   drum clip uses 36/38/42.
6. **Report**: key, tempo, the four tracks; **caveat: load drum samples to hear the kit**
   (or use the synth-drum variation). Melodic parts already sound.

## Consolidated run_code (verified)
```ts
const song = context.application.song;

// params — respect the Set; fall back to A minor
const root = song.scaleMode ? song.rootNote : 9;
const iv = (song.scaleMode && song.scaleIntervals.length) ? song.scaleIntervals : [0,2,3,5,7,8,10];
const bars = 8, BEATS = bars * 4, barsPerChord = 2;
const prog = [1, 6, 4, 5];                                  // I–vi–IV–V / i–VI–iv–v

const n = iv.length;
const deg = (d, oct) => { const i = ((d-1)%n+n)%n, o = oct + Math.floor((d-1)/n); return (o+2)*12 + root + iv[i]; };
const triad = (d, oct) => [d, d+2, d+4].map(x => deg(x, oct));
const inScale = new Set(iv.map(x => (root+x)%12));
const setP = async (dev, nm, v) => { const p = dev.parameters.find(x => x.name === nm); if (p) await p.setValue(v); };

// Chords — Wavetable pad
const chordsT = await song.createMidiTrack(); chordsT.name = "Chords";
const wt = await chordsT.insertDevice("Wavetable", 0);
await setP(wt, "Amp Attack", 0.35); await setP(wt, "Amp Release", 0.5); await setP(wt, "Flt 1 Freq", 0.45);
const chordClip = await chordsT.clipSlots[0].createMidiClip(BEATS); chordClip.name = "Chords";
const chordNotes = [];
prog.forEach((d, i) => triad(d, 1).forEach(p => chordNotes.push({ pitch: p, startTime: i*barsPerChord*4, duration: barsPerChord*4, velocity: 70 })));
chordClip.notes = chordNotes;

// Bass — Operator, root on offbeats (bass+kick composite)
const bassT = await song.createMidiTrack(); bassT.name = "Bass";
const op = await bassT.insertDevice("Operator", 0);
await setP(op, "Filter On", 1); await setP(op, "Filter Freq", 0.3); await setP(op, "Ae Decay", 0.3); await setP(op, "Ae Sustain", 0.25);
const bassClip = await bassT.clipSlots[0].createMidiClip(BEATS); bassClip.name = "Bass";
const bassNotes = [];
for (let bar = 0; bar < bars; bar++) {
  const rp = deg(prog[Math.floor(bar/barsPerChord) % prog.length], 0);
  [0.5,1.5,2.5,3.5].forEach(off => bassNotes.push({ pitch: rp, startTime: bar*4+off, duration: 0.45, velocity: 100 }));
}
bassClip.notes = bassNotes;

// Drums — Drum Rack + four-on-floor (needs samples to sound; see variation)
const drumsT = await song.createMidiTrack(); drumsT.name = "Drums";
await drumsT.insertDevice("Drum Rack", 0);
const drumClip = await drumsT.clipSlots[0].createMidiClip(BEATS); drumClip.name = "Beat";
const D = (pitch, t, v=100, d=0.25) => ({ pitch, startTime: t, duration: d, velocity: v });
const drumNotes = [];
for (let bar = 0; bar < bars; bar++) {
  const b = bar*4;
  for (let beat=0; beat<4; beat++) drumNotes.push(D(36, b+beat, 110));   // kick
  drumNotes.push(D(38, b+1, 100), D(38, b+3, 100));                      // snare 2 & 4
  for (let h=0; h<4; h++) drumNotes.push(D(42, b+0.5+h, 80, 0.1));       // offbeat hats
}
drumClip.notes = drumNotes;

// Lead — Drift, arc melody in key
const leadT = await song.createMidiTrack(); leadT.name = "Lead";
const dr = await leadT.insertDevice("Drift", 0);
await setP(dr, "Voice Mode", 0);
const leadClip = await leadT.clipSlots[0].createMidiClip(BEATS); leadClip.name = "Lead";
const leadDegs = [1,3, 5,4, 6,8, 7,5, 6,4, 5,3, 2,3, 2,1];               // arc, single peak (8)
leadClip.notes = leadDegs.map((d,i) => ({ pitch: deg(d,2), startTime: i*2, duration: 2, velocity: i%2 ? 78 : 95 }));

// light mix
await chordsT.mixer.volume.setValue(0.68); await chordsT.mixer.panning.setValue(-0.2);
await bassT.mixer.volume.setValue(0.82);
await drumsT.mixer.volume.setValue(0.85);
await leadT.mixer.volume.setValue(0.72); await leadT.mixer.panning.setValue(0.2);

const melodic = [...chordNotes, ...bassNotes, ...leadClip.notes].map(x => x.pitch);
const outOfKey = melodic.filter(p => !inScale.has(((p%12)+12)%12));
return { tempo: song.tempo, bars, outOfKeyCount: outOfKey.length,
  noteCounts: { chords: chordNotes.length, bass: bassNotes.length, drums: drumNotes.length, lead: leadClip.notes.length } };
```
Verified live: in C Major → `{outOfKeyCount:0, noteCounts:{chords:12,bass:32,drums:80,lead:16}}`.

## Definition of done
- 4 new tracks (Chords/Bass/Drums/Lead), each with its instrument + an 8-bar clip in `clipSlots[0]`.
- `outOfKeyCount === 0` (all melodic notes diatonic); drum clip uses pitches {36,38,42}.
- Bass note onsets fall on offbeats (clear of the kick downbeats).

## Variations & knobs
- **Key/mode:** pass a different `root`/`iv` (e.g. `[0,2,3,5,7,8,10]` minor) — everything follows.
- **Progression:** change `prog` (e.g. `[1,5,6,4]`, `[6,4,1,5]`); `barsPerChord` 1 for faster harmonic rhythm.
- **Feel:** breakbeat → move the kick off the grid; half-time → snare on beat 3 only; add ghost notes (`music-strategies/rhythm.md`, `ableton-midi/quantize-and-groove.md`).
- **Instruments:** swap any `insertDevice` name (see `ableton-sound-design/devices/`).
- **Humanize:** apply `humanize()` from `ableton-midi/quantize-and-groove.md` to drum/lead notes.

## Caveats
- **Drums are silent until you load samples** — a fresh Drum Rack has empty pads and the
  SDK can't load factory kits. Tell the user to drop kick/snare/hat samples on pads
  36/38/42, **or** use the synth-drum variation below.
- **No automation** — no filter sweeps/risers/sidechain; use static values + note motion.

### Synth-drum variation (audible kick without samples — verified)
Replace the Drums-track build with a synth kick (Operator: sine + pitch-envelope sweep
+ percussive amp). Hats/snare still need samples or their own synth voices.
```ts
const t = await song.createMidiTrack(); t.name = "Kick";
const op = await t.insertDevice("Operator", 0);
const set = async (nm, v) => { const p = op.parameters.find(x => x.name === nm); if (p) await p.setValue(v); };
await set("Osc-A Wave", 0);    // Sine
await set("Ae Attack", 0); await set("Ae Decay", 0.18); await set("Ae Sustain", 0);  // percussive
await set("Pe On", 1); await set("Pe Peak", 36); await set("Pe Decay", 0.12);        // pitch sweep down
await set("Pe Sustain", 0); await set("Pe End", 0); await set("Pe Amount", 1);
const clip = await t.clipSlots[0].createMidiClip(4);
clip.notes = [0,1,2,3].map(b => ({ pitch: 36, startTime: b, duration: 0.25, velocity: 112 }));  // C1 four-on-floor
return t.name;
```
