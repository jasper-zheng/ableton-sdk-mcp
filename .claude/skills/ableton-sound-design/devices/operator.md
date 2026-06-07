# Operator (FM/subtractive synth)

`insertDevice("Operator", i)`. Four oscillators (A–D) that can frequency-modulate each
other per the **Algorithm**, plus a filter, LFO, and per-oscillator envelopes. 195
params — key ones below; full list via `ableton_get_device`.

## Key parameters (name · range · meaning)
| Param | Range | Notes |
|-------|-------|------|
| `Algorithm` | 0–10 (quant, "Alg. 1"–"Alg. 11") | FM routing of A→B→C→D; Alg.11 = all parallel (additive) |
| `Volume` | 0–1 | overall level (normalized) |
| `Tone` | 0–1 | global high-frequency content/brightness |
| `Transpose` | −48..48 | semitones |
| `Spread` | 0–100 | unison detune width |
| `Osc-A Level`…`Osc-D Level` | 0–1 | per-oscillator output (A is the carrier in most algos) |
| `A Coarse`…`D Coarse` | 0–48 | frequency ratio (integer-ish); modulator ratio sets timbre |
| `A Fine` | 0–1000 | fine ratio detune |
| `Osc-A Wave` | 0–22 (quant) | "Sin","Sw*"(saw),"Sq*"(square),"Tri","No*"(noise),"User" |
| `Ae Attack`/`Ae Decay`/`Ae Sustain`/`Ae Release` | 0–1 | **amp envelope** (the audible ADSR; "Ae" = osc-A/amp env) |
| `Filter On` | 0/1 | enable filter |
| `Filter Type` | 0–4 (quant) | Lowpass/Highpass/Bandpass/Notch/Morph |
| `Filter Freq` | 0–1 | cutoff (normalized) |
| `Filter Res` | 0–1.25 | resonance |
| `Filter Drive` | 0–24 | dB of filter drive |
| `LFO On` / `LFO Type` / `LFO Rate` / `LFO Amt` | 0/1 · 0–6 · 0–127 · 0–1 | modulation |

## Tips
- **FM bass:** Algorithm with B modulating A (e.g. Alg. 1), `B Coarse` 1–2× A, short
  `Ae Decay`, low `Filter Freq`, a little `Filter Res`. Higher `Osc-B Level` = grittier.
- **Bell/EP:** non-integer modulator ratio (`B Coarse` 3–7), fast attack, long decay.
- **Pad:** parallel-ish algorithm, slow `Ae Attack`, low `Tone`, gentle LFO on Filter Freq.

## run_code
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "FM Bass";
const op = await track.insertDevice("Operator", 0);
const set = async (n, v) => { const p = op.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Filter On", 1);
await set("Filter Freq", 0.35);
await set("Filter Res", 0.3);
await set("Ae Decay", 0.25);
await set("Ae Sustain", 0.2);
return op.name;
```
