# Chorus-Ensemble

`insertDevice("Chorus-Ensemble", i)`. Two-delay-line chorus with an optional third
line and a vibrato mode — thickening, width, motion. 16 params.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Mode` | 0–2 (quant) | Chorus / Ensemble / Vibrato |
| `Rate` | 0–1 | modulation speed |
| `Amount` | 0–1 | modulation depth |
| `Feedback` | 0–1 | resonant feedback (flanger-ish at high values) |
| `FB Invert` | 0/1 | inverted feedback → hollow tone |
| `Width` | 0–1 | stereo width of the wet (Chorus/Ensemble) |
| `Warmth` | 0–1 | slight distortion/filtering for a warmer sound |
| `Delay Time` | 0–5 (quant) | Auto / 7 / 10 / 20 / 35 / 50 ms |
| `Output` | 0–1 | level |
| `Dry/Wet` | 0–1 | mix (1.0 on a return) |

## Tips
- **Subtle thicken:** `Mode` Chorus, low `Amount`, low `Rate`, `Width` ~0.7.
- **Lush strings:** `Mode` Ensemble (three lines), moderate `Amount`.
- **Surf-rock / vibrato:** `Mode` Vibrato, `Rate` ~0.3, full `Amount` (manual tip:
  Ensemble mode at a slow rate with high Amount on dry guitars).
- **Flange-y:** raise `Feedback`; flip `FB Invert` for a hollow character.

## run_code
```ts
const ch = await track.insertDevice("Chorus-Ensemble", track.devices.length);
const set = async (n, v) => { const p = ch.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Mode", 1);          // Ensemble
await set("Rate", 0.25); await set("Amount", 0.5); await set("Width", 0.8);
return ch.name;
```
