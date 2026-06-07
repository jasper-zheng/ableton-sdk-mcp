# Simpler (sample playback instrument)

`insertDevice("Simpler", i)`. Plays one sample across the keyboard with envelope,
filter, LFO. Load the sample with **`replaceSample(filePath)`** (Simpler-specific).
65 params; key ones below.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `S Start` / `S Length` | 0–1 | sample playback start / length (fraction) |
| `S Loop On` / `S Loop Length` | 0/1 · 0–1 | sustain loop |
| `Transpose` | −48..48 | semitones |
| `Detune` | −50..50 | cents |
| `Volume` | −36..36 | dB |
| `Ve Attack`/`Ve Decay`/`Ve Sustain`/`Ve Release` | 0–1 | amp (volume) envelope |
| `Trigger Mode` | 0/1 (quant) | "Trigger" (one-shot) / "Gate" |
| `F On` / `Filter Type` / `Filter Freq` / `Filter Res` / `Filter Drive` | 0/1 · 0–4 · 0–1 · 0–1.25 · 0–24 | filter |
| `Fe < Env` | −72..72 | filter envelope amount |
| `Voices` | 0–14 (quant, "1".."32") | polyphony (index) |
| `Glide Mode` / `Glide Time` | 0–2 · 0–1 | Off/Portamento/Glide |

## Sample loading
```ts
const simpler = await track.insertDevice("Simpler", 0);
await simpler.replaceSample("/absolute/path/to/sample.wav");  // needs a real path
```
`simpler.sample` → `{ filePath }` or null. The SDK can't browse Live's library, so
you need accessible file paths (ask the user if unknown).

## Tips
- **One-shot drum hit:** `Trigger Mode` = 0 (Trigger), short `Ve Decay`, `Voices` low.
- **Looped pad from a sample:** `S Loop On` 1, slow `Ve Attack`/`Release`, filter to taste.
- **Chop:** set `S Start`/`S Length` to play a slice of the loaded sample.

## run_code
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Sampler";
const s = await track.insertDevice("Simpler", 0);
// await s.replaceSample("/path/to/loop.wav");   // if you have a file
const set = async (n, v) => { const p = s.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Ve Attack", 0.05); await set("Ve Release", 0.3);
return { device: s.name, sample: s.sample ? s.sample.filePath : null };
```
