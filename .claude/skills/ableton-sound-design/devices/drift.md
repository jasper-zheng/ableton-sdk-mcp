# Drift (compact subtractive synth)

`insertDevice("Drift", i)`. A modern, CPU-light analog-style synth: 2 oscillators +
noise, one LP/HP filter, two envelopes + cycling envelope, one LFO, small mod matrix.
78 params; key ones below.

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Osc 1 Wave` | 0–6 (quant) | Sine/Triangle/Shark Tooth/Saturated/Saw/Pulse/Rectangle |
| `Osc 1 Shape` | 0–1 | wave shape / PWM |
| `Osc 2 Wave` | 0–4 (quant) | Sine/Triangle/Saturated/Saw/Rectangle |
| `Osc 2 Detune` | 0–1 | detune vs Osc 1 |
| `Osc 1 Gain` / `Osc 2 Gain` / `Noise Gain` | 0–1 | source levels |
| `LP Freq` / `LP Res` | 0–1 | low-pass cutoff / resonance |
| `LP Type` | 0/1 (quant, "I"/"II") | filter character |
| `HP Freq` | 0–1 | high-pass |
| `Env 1 Attack`/`Decay`/`Sustain`/`Release` | 0–1 | **amp envelope** |
| `Env 2 …` | 0–1 | mod envelope |
| `LFO Wave` / `LFO Rate` / `LFO Amt` | 0–8 · 0–1 · 0–1 | LFO |
| `Voice Mode` | 0–3 (quant) | Poly/Mono/Stereo/Unison |
| `Volume` | 0–1 | output |
| `Transpose` | −48..48 | semitones |

## Tips
- **Simple analog bass:** `Osc 1 Wave` Saw, `Voice Mode` Mono, low `LP Freq`, short
  `Env 1 Decay`, a touch of `LP Res`.
- **Lush poly:** `Voice Mode` Unison, small `Osc 2 Detune`, slow `Env 1 Attack`.
- Lightweight — good default when you want a quick, clean synth voice.

## run_code
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "Drift Bass";
const d = await track.insertDevice("Drift", 0);
const set = async (n, v) => { const p = d.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Voice Mode", 1);           // Mono
await set("LP Freq", 0.3);
await set("Env 1 Decay", 0.3); await set("Env 1 Sustain", 0.2);
return d.name;
```
