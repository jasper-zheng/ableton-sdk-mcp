# Rhythm & beat strategies

Execute via `ableton-midi` (examples.md
recipes 3 & 6; quantize-and-groove.md for feel).

## 3+3+2 (the tresillo)
The most common asymmetrical pattern across hip-hop, footwork, rock, Latin, EDM.
Counts **sixteenth notes between hits as 3+3+2**, repeating every 2 beats → hits at
sixteenth indices **0, 3, 6** then **8, 11, 14** (startTimes 0, .75, 1.5, 2, 2.75,
3.5 over a bar). Variations:
- **Overlay** it against more symmetrical patterns (it shines in contrast, e.g. as a
  kick under straight hats).
- **Skip/add notes** (leave out the middle "3", or add a 16th before the final "2"
  as an ornament) — the established 3+3+2 still dominates perception.
- **Extend the "3"**: repeat the 3-groups longer before the "2" resynchronizes →
  tension then release.
- Not just drums — build basslines, chords, melodies on 3+3+2 too.

## Programming Beats 1: On Looseness (human feel)
- **Partial quantize**: move notes only *part way* to the grid (e.g. 50%) to reduce
  sloppiness without killing feel.
- **Quantize selectively**: lock kick & snare, leave hats loose (or vice versa) —
  shifting the whole kit together is inaudible; contrast is what's heard.
- **Humanize**: subtle timing/velocity randomization — best on already-on-grid
  material (randomizing un-quantized notes just exaggerates errors).
- **Velocity is feel too**: even with perfect timing, accenting strong subdivisions
  (slight emphasis on the 1st & 3rd sixteenths) brings a stiff groove to life.
- **Push/pull**: drag snare/hats slightly **late** = laid-back/funk; **early** =
  nervous/driving (ska, punk). Only audible relative to elements that *don't* move.

## Programming Beats 2: Linear Drumming
**Linear** = monophonic drums, no two hits at once (drum hocket). Treats every drum
as equally important rather than role-bound (timekeeper vs accent). Don't just
remove overlaps — *compose* a single quasi-melodic line of drum hits. At fast tempos
a "rolling" composite emerges (common in DnB). Optional extra constraint: every
sixteenth-grid slot holds exactly one hit; vary velocities heavily to shape it.

## Programming Beats 3: Ghost Notes
Very quiet snare hits filling space between the main hits — propel the groove and
add human feel. Place low-velocity snares on the 2nd/3rd sixteenths around the
backbeat, or as fast 32nd-note pickups anticipating the downbeat (can sit slightly
behind the beat). Effective only if the instrument is velocity-sensitive
(multisampled acoustic drums respond best).

## Programming Beats 4: Top/Bottom, Left/Right
- **Top** = cymbals/hats (high frequency); **bottom** = kick/snare/toms. Genres build
  **top-down** (jazz: ride/hat lead, kick/snare accent) or **bottom-up** (rock/pop/
  R&B: kick+snare interplay leads, hats secondary). Ask which your genre is.
- **Left/right**: real drummers alternate hands; emulate by tiny velocity (or sample)
  variation on every other note (round-robin) for repeating streams.

## Bass Lines and Kick Drums as a Single Composite
Treat kick + bass as **one monophonic line**: never sound a bass note at the same
time as the kick. Forces compositional choices and keeps the low end clean.
- Trance/EDM: kick on downbeats, **bass on offbeats**.
- Techno/house: kick on every beat, bass more intricate but still interleaved.
- Watch real durations (808 kicks/long bass sustain may overlap even if MIDI doesn't)
  — at minimum keep **note onsets** from colliding. Compose clarity first, then add
  sidechain/EQ for the rest. (Tip: paste muted kick notes into the bass clip as a
  visual reference.)

## Asynchronous / Polyrhythmic Loops (motion in loop music)
Trigger one instrument with **multiple loops of different lengths** (via routing) so
they drift against a shared pulse. E.g. a 4-sixteenth loop + a 5-sixteenth loop
realign every 20 sixteenths → the ear hears three patterns (the two + the composite).
Add more odd lengths for longer composites; loop **automation/LFOs at yet another
length**; or offset a loop slightly off-grid for truly asynchronous (Eno-style)
drift. Even one "odd" loop against standard ones creates motion (acid tracks).

## Implied Rhythm in Short Loops & Misusing Tools (idea generation)
- **Implied rhythm**: loop a tiny (1–2 s) arbitrary fragment of audio/MIDI and
  listen repeatedly — rhythms (and melodies) *emerge* from repetition (pareidolia).
  Don't "fix" loop-boundary artifacts; play against the source's own tempo.
- **Misuse tools**: quantize to a much slower value (monophonic line → chords);
  record fast then slow down; slice non-rhythmic material; feed beat-juggling FX
  with anything. Learn what a tool is *for*, then make it do something else.

→ **Execute:** `ableton-midi` — drum pitch map (kick 36, snare 38, hat 42),
`euclid()`/3+3+2 index helpers, `humanize`/`swing`/`accent`/`shift` in
quantize-and-groove.md; separate tracks/clip-lengths for polyrhythm.
