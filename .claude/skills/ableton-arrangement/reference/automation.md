# Automation & clip envelopes — concepts + the hard limit

## What Live offers (manual ch25/26)
- **Automation:** time-varying parameter values drawn in the Arrangement (volume rides,
  filter sweeps, etc.). Red breakpoint envelopes per parameter.
- **Clip envelopes:** per-clip modulation of mixer/device/MIDI-CC parameters (ch26),
  which can also loop at a length unlinked from the clip's notes.

## The hard SDK limit (important — state it plainly)
**The Extensions SDK exposes no automation or clip-envelope API** (grep-confirmed: no
Automation/Envelope class). You **cannot**:
- draw or read automation breakpoints,
- create clip envelopes,
- record parameter motion over time.

You **can** only set a parameter's **current value** with `DeviceParameter.setValue(v)`
(and mixer params). That value is the live state, not persisted automation.

## Workarounds
1. **Per-section static values (preferred).** Instead of a sweep, set a different static
   parameter value for each section. Since you can't automate, give each section its own
   feel by setting the device/mixer params before/at that section (note: a single
   `setValue` changes the value globally, not per-section in the timeline — so this works
   best when you render/commit sections separately, or accept one value for playback).
2. **Bake motion into notes.** Reproduce rhythmic/tonal movement in MIDI instead of
   automation: velocity ramps, filter-like pitch/timbre changes via note choices,
   `ableton-midi` transformations (e.g. Velocity Shaper, Time Warp emulations).
3. **Tell the user.** If they ask for an automated filter sweep / volume fade, explain
   it must be drawn in Live's UI (or via a Max for Live tool) — the agent can set a
   target value but not the envelope.

## Don't over-claim
When a request needs real automation (risers, sidechain pumping via volume automation,
fades), say so and offer the static-value or note-based alternative — don't pretend to
write automation.
