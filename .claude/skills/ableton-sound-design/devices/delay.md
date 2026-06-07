# Delay

`insertDevice("Delay", i)`. Stereo delay with independent L/R times, sync, filter, and
an LFO for modulation. 27 params.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `L Sync` / `R Sync` | 0/1 | tempo-sync that side |
| `L 16th` / `R 16th` | 0–7 (quant) | synced division: "1","2","3","4","5","6","8","16" (sixteenths) |
| `L Time` / `R Time` | 0–1 | free time (when not synced) |
| `Link` | 0/1 | R follows L |
| `Ping Pong` | 0/1 | bounce L↔R |
| `Feedback` | 0–1 | number of repeats |
| `Filter On`/`Filter Freq`/`Filter Width` | 0/1 · 0–1 · 0–1 | band-filter the repeats |
| `Freeze` | 0/1 | hold current buffer |
| `Dry/Wet` | 0–1 | mix (≈1 on a return) |

## Tips
- **Synced 1/8 echo:** `L Sync` 1, `L 16th` = index 4 ("5"? no — see items); for a
  straight 1/8 pick the "2" division (two sixteenths) → index 1; dotted feels: try "3".
  (Set, then read back / listen — divisions are by index into the items list.)
- **Dub feedback:** higher `Feedback`, `Filter On` with a mid `Filter Freq` so repeats darken.
- **Width:** `Ping Pong` on for stereo bounce.
- As a **send** effect, `Dry/Wet` = 1 on a return track.

## run_code
```ts
const dl = await track.insertDevice("Delay", track.devices.length);
const set = async (n, v) => { const p = dl.parameters.find(x => x.name === n); await p.setValue(v); };
await set("L Sync", 1); await set("R Sync", 1); await set("Link", 1);
await set("L 16th", 1);              // index into ["1","2","3","4","5","6","8","16"]
await set("Feedback", 0.35); await set("Filter On", 1); await set("Filter Freq", 0.5);
await set("Dry/Wet", 0.25);
return dl.name;
```
