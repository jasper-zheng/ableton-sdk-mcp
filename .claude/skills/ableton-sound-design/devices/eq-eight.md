# EQ Eight (parametric EQ)

`insertDevice("EQ Eight", i)`. Eight filter bands. Params are per band, suffixed
`A`/`B` (two parallel edit groups; use the **A** set for normal mono editing). 84
params; pattern below (band `N` = 1–8).

## Per-band parameters (use the `A` set)
| Param | Range | Notes |
|-------|-------|------|
| `N Filter On A` | 0/1 | enable band N |
| `N Filter Type A` | 0–7 (quant) | "High Pass 48dB","High Pass 12dB","Low Shelf","Bell","Notch","High Shelf","Low Pass 12dB","Low Pass 48dB" |
| `N Frequency A` | 0–1 | **normalized** cutoff/center (≈20 Hz→20 kHz, logarithmic) |
| `N Gain A` | −15..15 | dB (shelf/bell only) |
| `N Q A` | 0–1 | bandwidth (normalized; higher = narrower) |

Global: `Output` (−12..12 dB), `Scale` (−2..2, scales all gains), `Adaptive Q` (0/1).

## Frequency mapping (normalized → approx Hz)
0→20 Hz, 0.25→~120 Hz, 0.5→~1 kHz, 0.75→~6 kHz, 1→20 kHz (log). Estimate, set, and
adjust — there's no Hz setter. To target ~100 Hz use ~0.23; ~1 kHz ~0.5; ~5 kHz ~0.72.

## Tips
- **High-pass rumble:** band 1 → `1 Filter Type A` = 0 (HP 48dB), `1 Frequency A` ~0.2 (≈80–100 Hz).
- **Carve mud:** a Bell (type 3) with negative `Gain` around 0.4–0.5 (≈300–600 Hz).
- **Air:** High Shelf (type 5) ~0.8 with +2–4 dB.

## run_code
```ts
const eq = await track.insertDevice("EQ Eight", track.devices.length);
const set = async (n, v) => { const p = eq.parameters.find(x => x.name === n); await p.setValue(v); };
await set("1 Filter On A", 1); await set("1 Filter Type A", 0); await set("1 Frequency A", 0.2); // HP ~90Hz
await set("4 Filter On A", 1); await set("4 Filter Type A", 3); await set("4 Frequency A", 0.45); await set("4 Gain A", -4); // cut mud
return eq.name;
```
