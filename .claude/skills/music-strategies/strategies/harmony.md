# Harmony strategies

For execution (turning these into MIDI), use `ableton-midi/reference/scales-and-harmony.md`.

## Creating Harmony 1: the basics
- A song is **in a key**: one note (the **tonic**) feels like "home". Key is
  established by repetition/insistence or by chord progressions that pull back to
  the tonic. **Tension → resolution** is the engine of most progressions.
- **Scales**: Major = W-W-H-W-W-W-H; natural minor = W-H-W-W-H-W-W (W=2 semitones,
  H=1). Everything is transposable — relationships are identical in any key.
- **Triads** = root + 3rd + 5th (stack two thirds). Quality from intervals:
  major triad = 4+3 semitones; minor = 3+4; diminished = 3+3.
- **Diatonic triads** (chords built only on scale notes), labeled with Roman
  numerals (uppercase = major, lowercase = minor, ° = diminished):
  - Major key: **I ii iii IV V vi vii°**
  - Minor key: **i ii° III iv v VI VII**
- A huge amount of music uses only these 7 diatonic chords — often just 2–3 of them.
- **Functional motion** (major-key tendencies; similar in minor):
  - After **I**, anything works.
  - **V** and **vii°** want to resolve to **I** (V can also go to vi).
  - **ii** and **IV** lead toward **V**/**vii°** (IV can also return to I, or to ii).
  - **vi** leads to **ii** or **IV**; **iii** tends toward **vi**.
  - Canonical example: **I–V–vi–IV** (countless pop songs).

## Creating Harmony 2: beyond triads (color)
- **Seventh chords**: add the 7th above the root → 4-note chords. **V7** = major
  triad + minor 7th (dominant 7th) → strong pull to I. Jazz-flavor a triad
  progression by swapping triads for diatonic 7ths.
- **Extensions**: keep stacking thirds → 9th, 11th, 13th chords. You rarely play
  every note — imply the chord with the most important notes (often the upper
  extension + the 3rd; the **root is often omitted**, covered by the bass). Don't
  overload the mix with huge stacks.
- **Alterations**: replace a chord tone with a note a semitone away (e.g. ♭5) for
  more color/ambiguity.
- **Non-triadic chords**: build from intervals other than thirds — **secundal**
  (clusters, adjacent notes), **quartal** (stack 5 semitones), **quintal** (stack 7).
  Usually outside major/minor; connected by voice leading, not function. Common in
  jazz/house (e.g. Mr. Fingers "Can You Feel It" — Am9 / Fmaj7 / Am11, in A minor;
  analysis is deliberately ambiguous).

## Voice Leading and Inversions (smoothness)
- Smooth progressions come less from *which* chords than from **voice leading** —
  treat each voice as a horizontal line. **Minimize motion**: move each voice the
  fewest semitones; **keep common tones** (notes shared by adjacent chords).
- **Inversion** = reorder a chord's notes (put a non-root in the bass) to reduce
  the distance voices travel. Root-position → root-position usually moves a lot;
  invert one chord to share a tone and shrink the leaps. → execute via the inversion
  helper in `scales-and-harmony.md`.

## Parallel Harmony (house/electronic flavor)
- **Parallel harmony**: every note of a chord moves by the *same* interval/direction
  — like copying a chord and transposing it (e.g. Cm7–Fm7–Gm7–B♭m7 all in identical
  voicing). Violates "good" voice-leading but has a distinct, alien, electronic sound.
- Origins: **sampled chords** (sample one chord, replay at different pitches →
  automatic parallel motion) and **chord memory** synths. Reproduce by transposing
  a fixed voicing — don't re-voice between chords.

## Harmonic Rhythm (speed of change)
- **Harmonic rhythm** = how often chords change (distinct from the **surface
  rhythm** of individual notes). They're independent: fast notes can sit over one
  slow-changing chord, and vice versa.
- Rule of thumb: fast surface rhythm ↔ slower harmonic rhythm (≈1 chord/bar), and
  slow surface rhythm ↔ faster harmonic rhythm. Vary harmonic rhythm to create
  sections (halve it for a breakdown; double it / condense 4 bars → 2 to drive an
  ending). Only pitched instruments count toward harmonic rhythm.

## Repetition and Insistence (harmony-free option)
- Persistent repetition makes even "arbitrary"/atonal patterns sound intentional —
  we find patterns in chaos. Acid/minimal techno often work with essentially no
  harmony: short, endlessly-repeated bass lines where dissonance is fine. If a
  pattern sounds unusable at first, loop it several times before judging. You own
  any randomness you apply.

→ **Execute:** `ableton-midi` (scales-and-harmony.md for progressions/voicings;
quantize-and-groove for harmonic-rhythm placement).
