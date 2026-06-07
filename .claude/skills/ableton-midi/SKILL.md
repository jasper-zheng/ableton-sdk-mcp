---
name: ableton-midi
description: Compose and edit MIDI in Ableton Live through the abletonsdk MCP tools — create MIDI clips (Session or Arrangement), write notes/chords/melodies/basslines/drum patterns, work in a key/scale, and apply transformations (arpeggiate, strum, quantize, humanize, groove). Use whenever the task is making or editing MIDI musical content in Live via run_code.
---

# Ableton MIDI composition & editing

You drive Live through the **abletonsdk** MCP tools (`ableton_run_code`,
`ableton_get_context`, `ableton_get_clip_notes`, `ableton_get_device`, …). This
skill is the *musical knowledge* layer; the MCP server is the *action* layer.

## Workflow
1. **Perceive** — `ableton_get_context` for tracks/clips/scenes and the Set's
   `tempo` + `scale` (`rootNote`, `scaleName`, `scaleMode`, `scaleIntervals`).
   Every object carries a stable `addr`.
2. **Decide what to make** — for melody/harmony/rhythm intent, consult the
   **`music-strategies`** skill (contour, motives, voice leading, 3+3+2, ghost
   notes, etc.). This skill is the *how-to-execute*; that one is the *what-to-write*.
3. **Act** — `ableton_run_code` with JS/TS against the SDK: create a clip, set
   `clip.notes`. Bindings: `context`, `ableton`, `log`, `withinTransaction`,
   `sleep`, `signal`. No imports; `return` a small JSON summary.
4. **Verify** — `ableton_get_clip_notes` on the clip's `addr` to confirm pitches,
   timing and that notes are in-key.

## Reference (read on demand)
| File | When |
|------|------|
| `reference/clips-and-notes.md` | Creating clips (Session vs Arrangement), the note model, reading back |
| `reference/scales-and-harmony.md` | Pitch numbers, scales/modes, building chords & progressions, voice leading — as run_code helpers |
| `reference/midi-transformations.md` | Reproduce Live's MIDI Tools (arpeggiate, strum, ornament, recombine, …) on note arrays |
| `reference/quantize-and-groove.md` | Quantize to grid, swing/groove, humanize timing & velocity |
| `examples.md` | Copy-paste run_code recipes (progression, scale-locked melody, drum beat, arpeggio) |

For raw SDK types read the MCP resource `ableton://api/sdk`; for bindings/limits
read `ableton://guide/run_code`.

## Hard limits (design around these)
- **Clip length and loop are fixed at creation.** Choose the right length up front.
  Arrangement clips **loop by default** — set `clip.looping = false` for one-shots.
- **Note `startTime` is clip-relative** (beats from the clip's start), not arrangement time.
- **Handles are ephemeral**; indices shift after add/delete. Re-`get_context` after structural edits.
- **No transport/playback** and **no programmatic undo** — rely on Live's native undo. Make edits legible.
- **Before overwriting an existing clip's notes** (or writing into an occupied slot): confirm + report "Cmd-Z to undo" — see **`ableton-safety`**.
- Live's interactive **MIDI Tools / Groove Pool / tuning systems are not in the SDK** —
  reproduce their effect in `run_code` (see the transformation/groove references).
- Work in **12TET MIDI pitches** (0–127); respect the Set's scale when composing tonal material.
