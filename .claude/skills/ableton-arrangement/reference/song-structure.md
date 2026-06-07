# Building song structure

Technical how-to for turning loops into a track. For *creative* form decisions
(subtractive arranging, formal skeletons, common forms, how to end), see
`music-strategies/finishing.md` (stub → WP4c) — this file is the execution side.

## Sections as bar ranges
Pick a section grid in bars and translate to beats (4/4: beat = (bar−1)*4). A common
electronic skeleton:
| Section | Typical length |
|---------|----------------|
| Intro | 8–16 bars (elements enter) |
| Verse / A | 16 bars |
| Build | 4–8 bars |
| Chorus / Drop / B | 16 bars |
| Breakdown | 8–16 bars (elements drop out) |
| Outro | 8–16 bars |

## Subtractive arranging (recommended)
Build the **full "everything" version** of your main loop across all instruments, then
create sections by **muting/omitting** elements rather than writing each section from
scratch (DeSantis, *Arranging as a Subtractive Process*). In code: place the full set
of clips per section, then `clip.muted = true` (or omit a track's clip) to thin out
intros/breakdowns.

```ts
// lay 4 sections x N tracks; thin the intro by muting all but drums
const song = context.application.song;
const SECT = 16 * 4;                       // 16-bar sections, beats
const sections = [0, SECT, SECT*2, SECT*3];// intro, verse, chorus, outro
for (const t of song.tracks) {
  for (let s = 0; s < sections.length; s++) {
    const clip = await t.createMidiClip(sections[s], SECT);
    clip.looping = false;
    // intro (s===0): keep only a "Drums" track audible
    if (s === 0 && t.name !== "Drums") clip.muted = true;
  }
}
```

## Variation & motion
- **Vary a repeat:** recreate the copied clip with altered notes (e.g. a fill in the
  last bar) — see `ableton-midi` transformations. No linked clips in the SDK.
- **Energy via density/register:** thin = fewer tracks/notes; lift = add octave, more
  percussion, open a filter (but automation isn't programmable — set a new static value
  per section's clips/devices instead; see `automation.md`).
- **Harmonic rhythm for sections:** halve chord-change speed for a breakdown, double to
  drive an ending (`music-strategies/harmony.md`).

## Mark it up
Add `song.createCuePoint(beat)` at each section start and name it ("Intro","Chorus") so
the structure is legible to the user.
