# Glue Compressor (bus compressor)

`insertDevice("Glue Compressor", i)`. SSL-style bus "glue" compressor. 18 params —
notably these are in **real units** (not normalized), so read the ranges.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Threshold` | −40..0 | dB; lower = more compression |
| `Ratio` | 0–2 (quant-ish index) | the classic 2:1 / 4:1 / 10:1 selector |
| `Attack` | 0–6 | index of attack times (0.01–30 ms) |
| `Release` | 0–6 | index of release times (incl. Auto) |
| `Range` | 0–70 | max gain reduction limit, dB |
| `Output` | 0–20 | makeup gain, dB |
| `Dry/Wet` | 0–1 | parallel mix |
| `Peak Clip In` | 0/1 | soft clipper on output |
| `S/C On`/`S/C EQ …` | 0/1 · … | sidechain + detector EQ |

## Tips
- **Mix-bus glue:** `Ratio` 2:1 (low index), slow `Attack`, `Release` Auto (highest
  index), aim for 2–4 dB reduction via `Threshold`, small `Output` makeup.
- **Drum-bus punch:** faster `Attack` index for snap, medium `Release`.
- Use on **group/return/main** tracks for cohesion; on individual sources prefer `Compressor`.

## run_code
```ts
const gc = await track.insertDevice("Glue Compressor", track.devices.length);
const set = async (n, v) => { const p = gc.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Threshold", -18);   // dB
await set("Ratio", 0);          // lowest index = gentle ratio
await set("Output", 3);         // dB makeup
return gc.name;
```
