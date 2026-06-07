# Echo (character delay)

`insertDevice("Echo", i)`. A richer delay than `Delay`: analog/digital character,
modulation, filtering, ducking, built-in reverb, noise/wobble. 53 params; key ones below.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `L Sync` / `R Sync` | 0/1 | tempo-sync each side |
| `L 16th` / `R 16th` | 1–16 | synced length in sixteenths |
| `L Sync Mode` / `R Sync Mode` | 0–3 (quant) | Synced/Triplet/Dotted/16th |
| `L Time` / `R Time` | 0–1 | free time when not synced |
| `Feedback` | 0–1 | repeats |
| `Channel Mode` | 0–2 (quant) | Stereo / Ping Pong / Mid/Side |
| `Filter On`/`HP Freq`/`LP Freq` | 0/1 · 0–1 · 0–1 | band the repeats |
| `Duck On`/`Duck Thr` | 0/1 · 0–1 | duck the wet under the dry signal |
| `Reverb Level`/`Reverb Decay`/`Reverb Loc` | 0–1 · 0–1 · 0–2 | built-in reverb (Pre/Post/Feedbk) |
| `Mod Wave`/`Mod Freq`/`Dly < Mod` | 0–5 · 0–1 · 0–1 | modulation of the delay time (wow/flutter) |
| `Noise On`/`Wobble On` | 0/1 | analog grit |
| `Dry Wet` | 0–1 | mix (note: param name is `Dry Wet`, no slash) |

## Tips
- **Vintage tape echo:** `L Sync` on with a dotted-8th feel, `Feedback` ~0.4,
  `Filter On` darkening repeats, a little `Noise On`/`Wobble On`, slight `Dly < Mod`.
- **Self-oscillating dub:** high `Feedback`, modulate filter; tame with `Duck On`.
- **Ambient:** raise `Reverb Level` and `Reverb Decay`.
- Use as a **send** (`Dry Wet` = 1 on a return) or as an insert for character.

## run_code
```ts
const e = await track.insertDevice("Echo", track.devices.length);
const set = async (n, v) => { const p = e.parameters.find(x => x.name === n); await p.setValue(v); };
await set("L Sync", 1); await set("R Sync", 1);
await set("Feedback", 0.4); await set("Filter On", 1); await set("LP Freq", 0.6);
await set("Dry Wet", 0.3);
return e.name;
```
