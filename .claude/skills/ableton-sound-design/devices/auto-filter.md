# Auto Filter

`insertDevice("Auto Filter", i)`. Filter with envelope-follower and LFO modulation. 46
params. Great for movement, sweeps, and wobble.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Frequency` | 0–1 | cutoff (normalized) |
| `Resonance` | 0–1 | resonance |
| `Filter Type` | 0–9 (quant) | Low-pass/High-pass/Band-pass/Notch/Morph/DJ/Comb/Resampling/Notch+LP/Vowel |
| `Filter Slope` | 0/1 (quant) | "12"/"24" dB |
| `Drive` | 0–1 | filter drive/saturation |
| `LFO Amount` | 0–1 | depth of LFO→cutoff |
| `LFO Wave` | 0–7 (quant) | Sine/Triangle/Saw/Square/Ramp Up/Ramp Down/Wander/S&H |
| `LFO T Mode` | 0–5 (quant) | Rate/Time/Synced/Triplet/Dotted/Sixteenth |
| `LFO Freq` / `LFO Rate` | 0–1 · 0–21 | free freq / synced rate (index when synced) |
| `Env Amount` | 0–1 | envelope-follower → cutoff |
| `Env Attack` / `Env Release` | 0–1 | follower response |
| `Dry/Wet` | 0–1 | mix |

## Tips
- **Wobble bass:** `LFO Amount` high, `LFO T Mode` Synced, `LFO Rate` to a fast division,
  `Resonance` mid, `Filter Type` Low-pass.
- **Auto-wah:** raise `Env Amount`, short `Env Attack` — cutoff tracks input dynamics.
- **Static tone-shape:** just set `Frequency`/`Resonance`, leave LFO/Env at 0.

## run_code
```ts
const af = await track.insertDevice("Auto Filter", track.devices.length);
const set = async (n, v) => { const p = af.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Filter Type", 0); await set("Frequency", 0.5); await set("Resonance", 0.4);
await set("LFO Amount", 0.5); await set("LFO T Mode", 2);  // Synced
return af.name;
```
