# Saturator (saturation / waveshaping)

`insertDevice("Saturator", i)`. Adds harmonics/warmth/grit. 19 params.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Drive` | 0–1 | input drive — the main amount |
| `Type` | 0–7 (quant) | Analog Clip / Soft Sine / Bass Shaper / Medium Curve / Hard Curve / Sinoid Fold / Digital Clip / Waveshaper |
| `Output` | 0–1 | output trim (compensate level) |
| `Dry/Wet` | 0–1 | blend |
| `Color On`/`Color Freq`/`Color Amt Low`/`Color Amt Hi` | 0/1 · 0–1 · 0–1 · 0–1 | pre/post tone shaping |
| `Post Clip Mode` | 0–2 (quant) | No Clip / Soft Clip / Hard Clip |
| `WS Drive`/`WS Curve`/`WS Depth`… | 0–1 | extra controls for the Waveshaper type |

## Tips
- **Warm glue:** `Type` Analog Clip or Medium Curve, modest `Drive`, lower `Output` to
  keep level matched, `Dry/Wet` ~0.5 for parallel warmth.
- **Bass weight:** `Type` Bass Shaper.
- **Aggressive:** Hard Curve / Digital Clip, higher `Drive`, `Post Clip Mode` Soft Clip
  to tame peaks.
- Watch level: saturation raises loudness — trim `Output` so A/B is fair.

## run_code
```ts
const sat = await track.insertDevice("Saturator", track.devices.length);
const set = async (n, v) => { const p = sat.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Type", 0); await set("Drive", 0.3); await set("Output", 0.45); await set("Dry/Wet", 0.6);
return sat.name;
```
