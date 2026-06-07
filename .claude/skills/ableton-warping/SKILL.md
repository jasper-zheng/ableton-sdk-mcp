---
name: ableton-warping
description: Work with audio clips, warping, and tempo in Ableton Live via the abletonsdk MCP tools — enable/set warp mode on audio clips, read warp markers, and reason about tempo. Use when handling audio (not MIDI) clips or time-stretching. Lower priority for the MIDI-centric v1.
---

# Ableton audio clips & warping (stub)

**Coverage: pending (WP4c).** This skill will distill manual ch9 (Audio Clips,
Tempo, and Warping) into warping recipes. Lower priority — v1 is MIDI-centric.

## Use now (works today)
- Song tempo: `song.tempo` (get/set) — `await` not needed; it's a plain property.
- Audio clips expose `warping`, `warpMode` (get/set), `warpMarkers`, `filePath`
  (read `ableton://api/sdk` → AudioClip, WarpMode enum).
- Create an audio clip on a track from a file:
  `track.createAudioClip({ filePath, startTime, duration?, isWarped?, loopSettings? })`
  (arrangement) or via the clip slot (session).
- Read warp info via `ableton_get_clip_notes` on the audio clip's `addr` (returns
  warp settings/markers instead of notes).

LIMITATION: warp marker *editing* and audio analysis are minimal in v1; the
`ableton_render_audio` tool renders pre-FX audio but analysis is deferred to v2.
