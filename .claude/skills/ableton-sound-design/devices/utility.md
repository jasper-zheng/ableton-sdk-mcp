# Utility (gain / width / mono / pan)

`insertDevice("Utility", i)`. Workhorse utility — gain, stereo width, mono-ing,
channel mode, DC filter. 12 params (several in real units, not normalized).

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Output` | −1..1 | gain trim (maps to ±35 dB; small moves = big dB) |
| `Balance` | −1..1 | L/R balance (−1 = full left) |
| `Stereo Width` | 0–2 | 0 = mono, 1 = original, 2 = extra-wide |
| `Mono` | 0/1 | sum to mono |
| `Bass Mono` / `Bass Freq` | 0/1 · 0–1 | mono below a frequency (tighten low end) |
| `Channel Mode` | 0–3 (quant) | Left / Stereo / Right / Swap |
| `Left Inv` / `Right Inv` | 0/1 | phase invert a channel |
| `DC Filter` | 0/1 | remove DC offset |
| `Mute` | 0/1 | mute |

## Tips
- **Gain staging:** insert `Utility` first/last and trim `Output` to set level without
  touching the mixer fader (handy before/after saturation).
- **Tighten lows:** `Bass Mono` on, `Bass Freq` ~0.2 → mono below ~120 Hz.
- **Width:** `Stereo Width` >1 to widen pads; =0 to check mono compatibility.
- **Fix phase:** `Left Inv`/`Right Inv` to correct out-of-phase stereo.

## run_code
```ts
const u = await track.insertDevice("Utility", track.devices.length);
const set = async (n, v) => { const p = u.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Bass Mono", 1); await set("Bass Freq", 0.2);
await set("Stereo Width", 1.2);
return u.name;
```
