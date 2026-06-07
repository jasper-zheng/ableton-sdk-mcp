# Compressor

`insertDevice("Compressor", i)`. Flexible compressor with sidechain. 23 params. Most
are **normalized 0–1** (not dB/ms) — obey the ranges.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Threshold` | 0–1 | level above which it compresses (normalized; lower value = more compression) |
| `Ratio` | 0–1 | compression amount (normalized; higher = stronger) |
| `Attack` | 0–1 | how fast it clamps (normalized) |
| `Release` | 0–1 | how fast it recovers |
| `Auto Release On/Off` | 0/1 | program-dependent release |
| `Knee` | 0–18 | soft→hard knee |
| `Model` | 0–2 (quant) | Peak / RMS / Expand |
| `Output` | −36..36 | makeup gain, dB |
| `Makeup` | 0/1 | auto makeup |
| `Dry/Wet` | 0–1 | parallel compression when <1 |
| `S/C On` | 0/1 | external sidechain input enable |
| `S/C EQ On`/`S/C EQ Freq`/`S/C EQ Gain` | 0/1 · 0–1 · −15..15 | filter the detector signal |

## Tips
- **Glue a bus:** `Ratio` ~0.3–0.5, slow-ish `Attack`, `Auto Release` on, a few dB `Output`.
- **Punch:** slower `Attack` (lets transients through), faster `Release`.
- **Parallel:** crush hard, then `Dry/Wet` ~0.3–0.5.
- **Sidechain pump:** see `../../ableton-mixing/reference/mixing-techniques.md` —
  note the SDK can't *route* an external sidechain source, only set `S/C On`/params.

## run_code
```ts
const comp = await track.insertDevice("Compressor", track.devices.length);
const set = async (n, v) => { const p = comp.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Threshold", 0.4); await set("Ratio", 0.4); await set("Attack", 0.2); await set("Release", 0.3);
return comp.name;
```
