---
name: ableton-arrangement
description: Arrange and structure a track in Ableton Live via the abletonsdk MCP tools — place clips on the Arrangement timeline, build song form (intro/verse/chorus/breakdown), duplicate/move sections, and work with automation and clip envelopes. Use when laying out or editing song structure over time (NOT for writing notes within a clip — that's ableton-midi).
---

# Ableton arrangement & structure

The *over-time* layer: lay clips onto the **Arrangement timeline** and shape song
form. `ableton-midi` makes the clips' contents; this skill places them in time.

## Workflow
1. **Perceive** — `ableton_get_context` for tracks + existing `arrangementClips`; the
   tempo/time-signature context.
2. **Plan structure** — decide sections (intro/verse/chorus/breakdown/outro) and their
   bar positions; for *creative* form ideas see `music-strategies` (finishing.md).
3. **Act** — `ableton_run_code`: create/place clips at beat positions, duplicate
   sections, clear ranges, add cue points.
4. **Verify** — `arrangementClips` / `ableton_get_clip_notes {kind:"arrangementClip",…}`.

## Time model
Positions are **beats** from the arrangement start (bar N in 4/4 starts at beat
`(N-1)*4`). A clip's own notes use **clip-relative** time. Clip length & loop are set
at **creation** and can't be changed after, so plan section lengths up front.

## Reference (read on demand)
| File | When |
|------|------|
| `reference/arrangement-clips.md` | Placing/duplicating/moving/clearing timeline clips, cue points, scenes |
| `reference/song-structure.md` | Building intro/verse/chorus/… ; subtractive arranging, common forms |
| `reference/automation.md` | Automation & clip-envelope concepts **and the hard SDK limit** |

## Hard limits
- **Clip timing/loop fixed at creation** — to "resize", delete and recreate.
- **No programmatic automation or clip envelopes** — you can set a parameter's
  *current* value (`setValue`) but cannot write time-varying automation. See
  `reference/automation.md` for the workaround/limit.
- **No clip fades** in the SDK (UI-only); no transport/playback control.
- **Before destructive edits** (`deleteClip` / `clearClipsInRange` / moving the user's clips): confirm + group one-undo — see **`ableton-safety`**.
- For clip *contents* → `ableton-midi`; for device/mixer values → `ableton-sound-design` / `ableton-mixing`.
