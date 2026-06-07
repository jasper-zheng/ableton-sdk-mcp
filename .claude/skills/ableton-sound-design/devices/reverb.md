# Reverb

`insertDevice("Reverb", i)`. Algorithmic reverb (input filters → early reflections →
diffusion network). 33 params, all continuous ones **normalized 0–1**.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Dry/Wet` | 0–1 | wet amount (set ~1.0 on a return track) |
| `Decay Time` | 0–1 | reverb length (normalized; the main "size in time") |
| `Room Size` | 0–1 | space size |
| `Predelay` | 0–1 | gap before reverb (normalized) |
| `Stereo Image` | 0–1 | width |
| `Diffusion` | 0–1 | density of the tail |
| `In Lo Cut On` / `In Hi Cut On` / `Input Freq` | 0/1 · 0/1 · 0–1 | pre-reverb filtering |
| `Diff. Hi On`/`Diff. Hi Freq`/`HiShelf Gain` | 0/1 · 0–1 · 0–1 | damp highs in the tail |
| `Density` | 0–3 (quant) | Sparse/Low/Mid/High |
| `Freeze On` | 0/1 | infinite tail |
| `Chorus On`/`Chorus Rate`/`Chorus Amount` | 0/1 · 0–1 · 0–1 | tail movement |

## Tips
- **Send reverb (recommended):** put it on a **return track**, `Dry/Wet` = 1, and feed
  it via track sends (see `ableton-mixing`). Keeps the dry signal clean.
- **Vocal/lead plate:** moderate `Decay Time`, some `Predelay` for clarity, hi-cut the tail.
- **Big ambient:** high `Decay Time` + `Room Size`, `Freeze On` for drones.
- Hi-cut the tail (`Diff. Hi`) to avoid harshness; lo-cut input to keep lows clean.

## run_code
```ts
const rv = await track.insertDevice("Reverb", track.devices.length);
const set = async (n, v) => { const p = rv.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Decay Time", 0.5); await set("Predelay", 0.15); await set("Dry/Wet", 0.25);
return rv.name;
```
