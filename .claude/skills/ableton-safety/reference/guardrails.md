# Guardrails — perceive, additive-first, don't clobber

## Perceive before you change
Always `ableton_get_context` (and `ableton_get_clip_notes`/`ableton_get_device` for
detail) before mutating. You need to know: which tracks/slots are occupied, the key &
tempo, what the user already made. Re-perceive after structural edits (handles are
ephemeral, indices shift).

## Additive-first
Prefer creating **new** tracks/clips/devices over editing existing ones:
- New track: `song.createMidiTrack()` then write to its empty `clipSlots[0]`.
- New clip only in an **empty** slot.
This keeps the user's existing work untouched and makes your changes easy to find and undo.

## Don't-clobber checks (do these before writing)
```ts
// before writing a clip into a session slot, ensure it's empty
const slot = track.clipSlots[i];
if (slot.clip) {
  // occupied — confirm before overwriting (see ui.confirm), or pick another slot / new track
}
// before deleting, only delete what YOU created this session; never the user's content
// before overwriting clip.notes on an existing clip, confirm first
```
- **Never** `deleteTrack`/`deleteClip`/`deleteDevice`/`clearClipsInRange` on the user's
  material without an explicit request **and** a confirm.
- Don't rename/recolor/move the user's existing tracks or clips unasked.
- When adding instruments to make a MIDI track audible, insert on a track **you** made.

## Confirm before every mutation
**Always `ui.confirm` before any action that changes the Set** — create, edit, or
delete — even small additive ones (a single new clip, one `setValue`, a new track).
Use `danger:true` for deletes/overwrites. Proceed only on Approve.
- For a multi-step build, confirm **once up front** with a plan summary (the `items`),
  then run the grouped build — don't pop a dialog per sub-step.
- **Only read-only perception runs without a confirm:** `get_context` / `get_device` /
  `get_clip_notes` / `get_selection`, and `run_code` that only returns data.

## Failing safe
If `ui.confirm` can't show or returns false, **do not perform the change** — report
that it was cancelled. Treat the absence of approval as denial (for any mutation, not
just destructive ones).

## Report (every action)
End with a concise summary: what was created/changed (tracks, clips, note counts, key)
and **"press Cmd-Z to undo"** (one entry if you grouped the batch — see
`undo-and-transactions.md`). Legibility is part of safety: the user should always know
what just happened to their Set.
