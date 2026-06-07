# Wavetable (wavetable synth)

`insertDevice("Wavetable", i)`. Two wavetable oscillators + sub, two filters, three
envelopes, two LFOs. 93 params; key ones below (full list via `ableton_get_device`).

## Key parameters
| Param | Range | Notes |
|-------|-------|------|
| `Osc 1 On` / `Osc 2 On` / `Sub On` | 0/1 | enable sources |
| `Osc 1 Pos` / `Osc 2 Pos` | 0–1 | position in the wavetable (the core timbre control) |
| `Osc 1 Transp` / `Osc 2 Transp` | −24..24 | semitones |
| `Osc 1 Detune` / `Osc 2 Detune` | 0–1 | detune amount |
| `Osc 1 Gain` / `Osc 2 Gain` / `Sub Gain` | 0–1 | levels |
| `Flt 1 On` / `Flt 1 Type` / `Flt 1 Freq` / `Flt 1 Res` / `Flt 1 Drive` | 0/1 · 0–4 · 0–1 · 0–1 · 0–1 | filter 1 (Type: LP/HP/BP/Notch/Morph) |
| `Amp Attack`/`Amp Decay`/`Amp Sustain`/`Amp Release` | 0–1 | amp envelope |
| `Env 2 …` / `Env 3 …` | 0–1 | modulation envelopes |
| `LFO 1 Shape`/`LFO 1 Rate`/`LFO 1 Amount` | 0–4 · 0–1 · 0–1 | LFO 1 (Sine/Tri/Saw/Rect/Noise) |
| `Unison Amount` | 0–1 | unison thickness |
| `Transpose` | −48..48 | global |
| `Volume` | 0–1 | output |

## Tips
- **Evolving pad:** modulate `Osc 1 Pos` with LFO/Env, slow `Amp Attack`, `Flt 1 Freq`
  ~0.4, add `Unison Amount`.
- **Detuned saw bass:** both oscillators on, small `Osc 2 Detune`, sub on, low `Flt 1 Freq`.
- The wavetable *selection* (which table) isn't a numeric param — `Osc * Pos` sweeps
  within the current table; for a different table the user must pick it in the UI.

## run_code
```ts
const song = context.application.song;
const track = await song.createMidiTrack(); track.name = "WT Pad";
const wt = await track.insertDevice("Wavetable", 0);
const set = async (n, v) => { const p = wt.parameters.find(x => x.name === n); await p.setValue(v); };
await set("Amp Attack", 0.4); await set("Amp Release", 0.6);
await set("Flt 1 On", 1); await set("Flt 1 Freq", 0.4);
await set("Unison Amount", 0.3);
return wt.name;
```
