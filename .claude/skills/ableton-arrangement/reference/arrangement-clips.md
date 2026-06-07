# Arrangement clips, cue points & scenes

## Placing clips on the timeline
| Action | Call |
|--------|------|
| MIDI clip on the timeline | `await midiTrack.createMidiClip(startTime, duration)` (beats) |
| Audio clip on the timeline | `await audioTrack.createAudioClip({ filePath, startTime, duration?, isWarped?, loopSettings? })` |
| List a track's timeline clips | `track.arrangementClips` (Clip[]) |
| Delete one | `await track.deleteClip(clip)` |
| Clear a time range | `await track.clearClipsInRange(startTime, endTime)` (truncates clips that overlap the edges) |

Arrangement clips **loop by default** → `clip.looping = false` for one-shots. A clip
exposes `startTime`, `endTime`, `duration`, `name`, `color`, `muted`, `looping`
(read; timing is creation-fixed).

## Read back
`ableton_get_clip_notes { addr: { kind:"arrangementClip", track:<i>, index:<k> } }`
returns the clip meta + notes (MIDI) or warp info (audio). `index` is the position in
`track.arrangementClips`.

## Build a section and repeat it
```ts
const song = context.application.song;
const track = song.tracks[0];                          // resolve via get_context addr
const BAR = 4;                                          // 4/4
// place a 4-bar MIDI clip at bar 1, then copies at bars 5 and 9
for (const bar of [0, 4, 8]) {
  const clip = await track.createMidiClip(bar * BAR, 4 * BAR);
  clip.notes = [{ pitch: 60, startTime: 0, duration: 1, velocity: 100 }]; // fill from ableton-midi
  clip.looping = false;
}
return track.arrangementClips.map(c => ({ start: c.startTime, end: c.endTime }));
```
There's no single "duplicate clip to time X" call — recreate the clip (and its notes)
at the new `startTime`. Read the source notes via `clip.notes` and write them into the copy.

## Cue points (locators) & scenes
- `song.cuePoints` / `await song.createCuePoint(timeBeats)` / `song.deleteCuePoint(cp)` —
  named markers on the timeline for sections (`cuePoint.name` settable).
- `song.scenes` / `await song.createScene(index)` — Session-view rows (structural in
  Session workflows); `scene.name` settable.

## Linked vs separate sections
To vary a repeated section (e.g. a fill in the last bar), recreate that copy with
modified notes rather than expecting linked edits — the SDK has no linked-track editing.
