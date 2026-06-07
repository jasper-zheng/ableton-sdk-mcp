# run_code recipes

Self-contained snippets for `ableton_run_code`. Each creates/edits real MIDI in
Live and returns a small summary. Adjust key/tempo to the Set (`ableton_get_context`).

## 1. Chord progression (Session clip)
```ts
const song = context.application.song;
const root = 9, iv = [0,2,3,5,7,8,10];           // A natural minor
const deg = (d, oct=1) => { const n=iv.length, i=((d-1)%n+n)%n, o=oct+Math.floor((d-1)/n); return (o+2)*12+root+iv[i]; };
const triad = (d, oct=1) => [d,d+2,d+4].map(x=>deg(x,oct));
const prog = [1, 7, 6, 4];                         // i - VII - VI - IV
const track = await song.createMidiTrack(); track.name = "Chords";
const clip = await track.clipSlots[0].createMidiClip(prog.length * 4);
clip.name = "i-VII-VI-IV";
const notes = [];
prog.forEach((d, bar) => triad(d).forEach(p => notes.push({ pitch:p, startTime:bar*4, duration:4, velocity:85 })));
clip.notes = notes;
return { track: track.name, bars: prog.length, noteCount: notes.length };
```

## 2. Scale-locked melody with contour (arc + single peak)
```ts
const song = context.application.song;
const root = 9, iv = [0,2,3,5,7,8,10];
const deg = (d) => { const n=iv.length, i=((d-1)%n+n)%n, o=1+Math.floor((d-1)/n); return (o+2)*12+root+iv[i]; };
const contour = [1,3,2,5, 4,6,8,7, 6,4,5,3, 2,1];  // rises to a single peak (degree 8) then falls — an arc
const track = await song.createMidiTrack(); track.name = "Lead";
const clip = await track.clipSlots[0].createMidiClip(8);
clip.notes = contour.map((d,i)=>({ pitch:deg(d), startTime:i*0.5, duration:0.5, velocity: i%2===0?100:80 }));
return { noteCount: clip.notes.length, peak: Math.max(...clip.notes.map(n=>n.pitch)) };
```

## 3. Drum beat (four-on-the-floor + offbeat hats + 3+3+2 option)
Drum-rack pitch map (Live default): kick 36, snare 38, closed hat 42.
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Beat";
const clip = await track.clipSlots[0].createMidiClip(4);   // 1 bar
const N = (pitch, t, v=100, d=0.25) => ({ pitch, startTime:t, duration:d, velocity:v });
const notes = [];
for (let b=0;b<4;b++) notes.push(N(36, b, 110));            // kick on every beat
notes.push(N(38, 1, 100), N(38, 3, 100));                  // snare on 2 & 4
for (let s=0;s<8;s++) notes.push(N(42, 0.5*s + 0.25, s%2?70:90, 0.1)); // offbeat-ish hats, accented
clip.notes = notes;
return { noteCount: notes.length };
// 3+3+2 kick variant: hits at sixteenth indices 0,3,6,8,11,14 → startTimes [0,.75,1.5,2,2.75,3.5]
```

## 4. Arpeggio from a held chord (transform recipe)
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Arp";
const clip = await track.clipSlots[0].createMidiClip(4);
const chord = [57,60,64].map(p => ({ pitch:p, startTime:0, duration:4, velocity:90 })); // Am
const step = 0.25, reps = Math.floor(4/ (chord.length*step));
const out = [];
for (let r=0;r<reps;r++) chord.map(n=>n.pitch).sort((a,b)=>a-b).forEach((p,i)=>
  out.push({ pitch:p, startTime: r*chord.length*step + i*step, duration:step, velocity:90 }));
clip.notes = out;
return { noteCount: out.length };
```

## 5. Edit an existing clip — humanize in place
```ts
const song = context.application.song;
const clip = song.tracks[0].clipSlots[0].clip;   // resolve the target via get_context's addr in practice
if (!clip) return { error: "no clip" };
const j = a => (Math.random()*2-1)*a;
clip.notes = clip.notes.map(n => ({ ...n,
  startTime: Math.max(0, n.startTime + j(0.012)),
  velocity: Math.max(1, Math.min(127, Math.round((n.velocity == null ? 100 : n.velocity) + j(8)))) }));
return { humanized: clip.notes.length };
```

## 6. Bass + kick as one composite (low-end clarity)
Keep bass note onsets off the kick's beats (manual: bass on offbeats, kick on downbeats).
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Bass";
const clip = await track.clipSlots[0].createMidiClip(4);
const A1 = 33;                                   // low A
// kick on each beat (0,1,2,3) → place bass on the offbeat eighths (0.5,1.5,2.5,3.5)
clip.notes = [0.5,1.5,2.5,3.5].map(t => ({ pitch:A1, startTime:t, duration:0.45, velocity:100 }));
return { noteCount: clip.notes.length };
```
