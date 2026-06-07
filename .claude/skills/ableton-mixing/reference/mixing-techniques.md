# Mixing techniques (with SDK-realistic methods)

Devices referenced here are documented in `ableton-sound-design/devices/`. Mix by
parameter values + musical reasoning — there is **no metering or master capture** in
the SDK, so set sensible values and rely on the user's ears.

## Gain staging
- Start with faders near unity; balance levels with `track.mixer.volume`.
- Use **`Utility`** (`Output`) for clean trims inside the device chain (before/after
  saturation) without moving the fader.
- Keep headroom on the **main** track; add a `Limiter` last if needed.

## EQ carving (`EQ Eight`)
- **High-pass** non-bass tracks to clear low-end mud (band 1 HP ~80–120 Hz → `1 Frequency A` ~0.2).
- **Carve** competing mids with a narrow Bell cut (e.g. −3 dB ~300–500 Hz) rather than
  boosting everything.
- **Complementary EQ:** cut in one source where another needs space (kick vs bass).

## Compression
- **Track:** `Compressor` for control (2–4 dB reduction; see device file for the
  normalized ranges).
- **Bus/group/main:** `Glue Compressor` for cohesion (gentle ratio, slow attack, auto release).
- **Parallel:** low `Dry/Wet` to add density without squashing.

## Balance & space
- **Pan** for width and to separate similar sources (`mixer.panning`).
- **Depth** via send reverb/delay on **return tracks** (see `mixer-and-routing.md`):
  more send = further back.
- **Width/mono:** `Utility` `Stereo Width`; `Bass Mono` to keep lows centered/tight.

## Low-end clarity (compose first, then mix)
The strongest fix is compositional — keep kick and bass out of each other's way
(`music-strategies/rhythm.md` → *Bass Lines and Kick Drums as a Single Composite*).
Then reinforce with EQ (carve the bass where the kick lives) and `Utility` `Bass Mono`.

## Sidechain pumping — the limit
True sidechain (duck the bass under the kick) needs the compressor's **external
sidechain input routed to the kick** — the SDK can enable `S/C On` but **cannot set the
sidechain source**, and there's **no volume automation**. So:
- You can't programmatically create classic sidechain pumping.
- Alternatives: the bass+kick **composite** (compose the duck), or tell the user to set
  the sidechain routing in Live's UI. Don't claim to have created sidechain ducking.
