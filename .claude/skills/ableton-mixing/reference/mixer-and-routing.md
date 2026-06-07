# Mixer & routing (manual ch17/18)

## Per-track mixer
`track.mixer` (TrackMixer) exposes `DeviceParameter`s:
| Param | Range | Notes |
|-------|-------|------|
| `volume` | ~0–1 (normalized) | ~0.85 ≈ 0 dB; read current value first, nudge relatively |
| `panning` | −1..1 | −1 hard left, 0 center, +1 hard right |
| `sends[i]` | 0–1 | amount sent to return track `i` |

Read all current values cheaply from `ableton_get_context` (mixer values are included
per track). Set via `run_code`:
```ts
const song = context.application.song;
const t = song.tracks[0];                              // resolve via get_context addr
await t.mixer.volume.setValue(0.8);
await t.mixer.panning.setValue(-0.3);                  // a bit left
if (t.mixer.sends.length) await t.mixer.sends[0].setValue(0.25);  // send to return A
```

## Return & main tracks
- `song.returnTracks` — return (send/aux) tracks; put **send effects** here (Reverb,
  Delay/Echo with `Dry/Wet` = 1) and feed them via each track's `mixer.sends[i]`
  (index aligns with the return track order).
- `song.mainTrack` — the master; put bus processing here (`Glue Compressor`, `EQ Eight`,
  `Utility`, `Limiter`). It has a mixer too.
- `track.groupTrack` — the group a track belongs to (null if none). Process a submix on
  the group track. (Creating groups isn't an SDK call; groups created in the UI are
  visible as tracks.)

## Send → return effect pattern (recommended)
1. Ensure a return track has the effect (e.g. Reverb) with `Dry/Wet` = 1.
2. Raise each source track's `mixer.sends[returnIndex]` to taste.
This shares one reverb across many tracks and keeps dry signals clean (vs an insert per track).

```ts
// add a 0.2 reverb send from track 0 to return 0 (assumes return 0 hosts a Reverb @ Dry/Wet 1)
const song = context.application.song;
await song.tracks[0].mixer.sends[0].setValue(0.2);
return song.returnTracks.map(r => r.name);
```

## Group / crossfader / cue
Group submixing: process on the group track. The crossfader, cue/solo, and track
delays (manual ch18) are UI/performance features not exposed as SDK params — focus on
volume/pan/sends + insert/bus devices.
